import uuid
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes.analysis import router
from app.api.routes.company import router as company_router
from app.config.settings import settings
from app.utils.logger import logger
from app.utils.limiter import limiter

app = FastAPI(title="ForeTrace API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── CORS Hardening ───────────────────────────────────────────────────────────

if settings.env == "prod":
    origins = [settings.frontend_url]
else:
    origins = [
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
    allow_credentials=True,
)


# ── Payload Size Limit Middleware ────────────────────────────────────────────

@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    if request.method in ("POST", "PUT"):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 10 * 1024:  # 10KB limit for REST
            logger.warning(
                f"Payload size limit exceeded on {request.url.path} from client {request.client.host if request.client else 'unknown'}"
            )
            return JSONResponse(
                status_code=413,
                content={"detail": "Request body too large. Maximum size is 10KB."}
            )
    return await call_next(request)


# ── Authentication Middleware ────────────────────────────────────────────────

@app.middleware("http")
async def authenticate_requests(request: Request, call_next):
    path = request.url.path
    is_ws = request.headers.get("upgrade", "").lower() == "websocket"
    
    # Bypass auth for health check, API documentation, and WebSocket upgrade (which is handled inside WS route)
    if path in ("/health", "/docs", "/openapi.json", "/redoc") or is_ws:
        return await call_next(request)
        
    if settings.api_key:
        api_key_header = request.headers.get("X-API-Key")
        api_key_query = request.query_params.get("token")
        
        if api_key_header != settings.api_key and api_key_query != settings.api_key:
            logger.warning(
                f"Unauthorized request to {path} from client {request.client.host if request.client else 'unknown'}",
                extra={"metadata": {"event": "auth_failure", "path": path, "ip": request.client.host if request.client else "unknown"}}
            )
            return JSONResponse(
                status_code=401,
                content={"detail": "Unauthorized. Invalid or missing X-API-Key header or token."}
            )
        
        logger.info(
            f"Authenticated request to {path} from client {request.client.host if request.client else 'unknown'}",
            extra={"metadata": {"event": "auth_success", "path": path, "ip": request.client.host if request.client else "unknown"}}
        )
        
    return await call_next(request)


# ── Global Exception Handler ──────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    correlation_id = str(uuid.uuid4())
    logger.error(
        f"Unhandled server error [Correlation ID: {correlation_id}]: {exc}",
        exc_info=True,
        extra={"metadata": {"event": "unhandled_exception", "correlation_id": correlation_id}}
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal error occurred. Please try again later.",
            "correlation_id": correlation_id
        }
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

app.include_router(router)
app.include_router(company_router)


@app.get("/health")
@limiter.limit("60/minute")
async def health(request: Request):
    """
    Comprehensive health check validating all key dependencies.
    """
    from app.clients.groq_client import groq_circuit
    from app.clients.sec_client import sec_circuit
    from app.services.cache_service import analysis_cache
    
    groq_state = groq_circuit.state.name
    sec_state = sec_circuit.state.name
    
    is_ok = groq_state != "OPEN" and sec_state != "OPEN"
    status = "ok" if is_ok else "degraded"
    
    return {
        "status": status,
        "services": {
            "groq": {
                "status": "ok" if groq_state != "OPEN" else "failed",
                "circuit_breaker": groq_state
            },
            "sec": {
                "status": "ok" if sec_state != "OPEN" else "failed",
                "circuit_breaker": sec_state
            },
            "cache": {
                "status": "ok",
                "size": len(analysis_cache._store)
            }
        }
    }
