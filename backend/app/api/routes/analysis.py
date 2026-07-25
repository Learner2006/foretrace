import asyncio
import json
import time
import uuid
from collections import defaultdict
from fastapi import APIRouter, Request, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, Any, Optional

from app.schemas.analysis import AnalyzeRequest
from app.services.analysis_service import analysis_service
from app.services.cache_service import analysis_cache
from app.utils.logger import logger
from app.utils.limiter import limiter
from app.config.settings import settings
from app.utils.logger import logger, request_id_var, correlation_id_var

router = APIRouter()


# ── WebSocket Rate Limiter ───────────────────────────────────────────────────

class WebSocketRateLimiter:
    def __init__(self, limit: int = 10, window: int = 60):
        self.limit = limit
        self.window = window
        self.redis_client = None
        
        if settings.redis_url:
            try:
                import redis
                self.redis_client = redis.from_url(settings.redis_url)
                logger.info("WebSocket rate limiter initialized with Redis backend")
            except Exception as e:
                logger.warning(f"Failed to initialize Redis for WebSocket rate limiter: {e}. Falling back to in-memory.")
                self.redis_client = None
                
        if not self.redis_client:
            self.connections = defaultdict(list)

    def is_rate_limited(self, ip: str) -> bool:
        if self.redis_client:
            try:
                key = f"ws_ratelimit:{ip}"
                now = time.time()
                pipe = self.redis_client.pipeline()
                pipe.zadd(key, {str(now): now})
                pipe.zremrangebyscore(key, 0, now - self.window)
                pipe.zcard(key)
                pipe.expire(key, self.window)
                _, _, count, _ = pipe.execute()
                return count > self.limit
            except Exception as e:
                logger.error(f"Redis rate limiter error: {e}. Falling back to in-memory rate limiting.")

        now = time.time()
        self.connections[ip] = [t for t in self.connections[ip] if now - t < self.window]
        if len(self.connections[ip]) >= self.limit:
            return True
        self.connections[ip].append(now)
        return False


ws_rate_limiter = WebSocketRateLimiter()


# ── WebSocket Helpers ────────────────────────────────────────────────────────

async def verify_ws_connection(websocket: WebSocket) -> bool:
    # 1. Origin check
    origin = websocket.headers.get("origin")
    allowed_origins = [settings.frontend_url]
    if settings.env == "dev":
        allowed_origins.extend([
            "http://localhost:5173", "http://localhost:3000",
            "http://127.0.0.1:5173", "http://127.0.0.1:3000",
            "http://localhost:8000", "http://127.0.0.1:8000"
        ])
    if origin and origin not in allowed_origins:
        logger.warning(f"WebSocket rejected: Invalid origin {origin}")
        await websocket.close(code=4000)
        return False

    # 2. Rate limiter check (max 10 connections per IP per minute)
    forwarded_for = websocket.headers.get("X-Forwarded-For")
    if forwarded_for:
        ip = forwarded_for.split(",")[0].strip()
    else:
        ip = websocket.client.host if websocket.client else "unknown"

    if ws_rate_limiter.is_rate_limited(ip):
        logger.warning(f"WebSocket rejected: Rate limit exceeded for IP {ip}")
        await websocket.close(code=4029)
        return False

    # 3. Authentication
    token = websocket.query_params.get("token")
    if settings.api_key and token != settings.api_key:
        logger.warning(f"WebSocket rejected: Invalid token from IP {ip}")
        await websocket.close(code=4003)
        return False

    logger.info(f"WebSocket connection verified for IP {ip}")
    return True


async def ping_loop(websocket: WebSocket, lock: Optional[asyncio.Lock] = None):
    """Sends a ping message to the client every 30 seconds to maintain connection health."""
    try:
        while True:
            await asyncio.sleep(30)
            if lock:
                async with lock:
                    await websocket.send_json({"type": "ping"})
            else:
                await websocket.send_json({"type": "ping"})
    except Exception:
        pass


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/analyze")
@limiter.limit("10/minute")
async def analyze(request: Request, req: AnalyzeRequest):
    req_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
    corr_id = str(uuid.uuid4())
    request_id_var.set(req_id)
    correlation_id_var.set(corr_id)
    
    logger.info(f"Received analysis request for {req.company_name} (ticker: {req.ticker})", extra={"metadata": {"event": "incoming_request", "company_name": req.company_name, "ticker": req.ticker}})
    try:
        # Wrap the service call in a 120-second timeout
        result = await asyncio.wait_for(
            analysis_service.analyze_company(req.company_name, req.ticker),
            timeout=120.0
        )
        if req.ticker:
            analysis_cache.set(req.ticker, result)
        logger.info(f"Analysis completed successfully for {req.company_name}", extra={"metadata": {"event": "analysis_success", "company_name": req.company_name}})
        return result
    except asyncio.TimeoutError:
        logger.error(f"Analysis request timed out for {req.company_name}")
        raise HTTPException(status_code=504, detail="Request timed out. Analysis took longer than 120 seconds.")
    except HTTPException as e:
        raise e
    except Exception as e:
        correlation_id = str(uuid.uuid4())
        logger.error(f"Internal error during analysis [Correlation ID: {correlation_id}]: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An internal error occurred. Please try again later. Correlation ID: {correlation_id}")


@router.websocket("/ws/analyze/{ticker}")
async def websocket_analyze(websocket: WebSocket, ticker: str):
    if not await verify_ws_connection(websocket):
        return

    req_id = f"WSREQ-{uuid.uuid4().hex[:8].upper()}"
    corr_id = str(uuid.uuid4())
    request_id_var.set(req_id)
    correlation_id_var.set(corr_id)

    await websocket.accept()
    logger.info(f"WebSocket connected for ticker: {ticker}")
    ws_lock = asyncio.Lock()
    ping_task = asyncio.create_task(ping_loop(websocket, ws_lock))

    async def safe_send_json(payload: dict):
        async with ws_lock:
            await websocket.send_json(payload)

    try:
        # Disconnect after 5 minutes of inactivity while waiting for payload
        data_text = await asyncio.wait_for(websocket.receive_text(), timeout=300.0)
        
        # Enforce 1MB size limit per message
        if len(data_text.encode('utf-8')) > 1024 * 1024:
            await safe_send_json({"type": "error", "message": "Payload size limit exceeded (max 1MB)"})
            await websocket.close(code=1009)
            return

        data = json.loads(data_text)
        
        try:
            req = AnalyzeRequest(**data)
        except Exception as ve:
            logger.warning(f"WebSocket request validation failed: {ve}")
            await safe_send_json({"type": "error", "message": f"Validation failed: {str(ve)}"})
            await websocket.close(code=1003)
            return

        company_name = req.company_name
        ticker_val = req.ticker or ticker

        async def on_step(step_idx: int):
            logger.info(f"WebSocket step {step_idx} for {ticker}")
            await safe_send_json({"type": "step", "step": step_idx})

        # Run pipeline with a 120-second timeout
        result = await asyncio.wait_for(
            analysis_service.analyze_company(company_name, ticker_val, on_step_cb=on_step),
            timeout=120.0
        )
        
        analysis_cache.set(ticker_val, result)
        logger.info(f"WebSocket analysis complete for {ticker}. Sending results.")
        await safe_send_json({"type": "result", "data": result})

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for {ticker}")
    except asyncio.TimeoutError:
        logger.error(f"WebSocket analysis timed out for {ticker}")
        try:
            await safe_send_json({"type": "error", "message": "Analysis timed out (max 120 seconds). Please try again."})
        except Exception:
            pass
    except Exception as e:
        correlation_id = str(uuid.uuid4())
        logger.error(f"WebSocket error for {ticker} [Correlation ID: {correlation_id}]: {e}", exc_info=True)
        try:
            await safe_send_json({"type": "error", "message": f"An internal error occurred. Please try again later. Correlation ID: {correlation_id}"})
        except Exception:
            pass
    finally:
        ping_task.cancel()
        try:
            await websocket.close()
        except Exception:
            pass


