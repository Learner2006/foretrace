from fastapi import APIRouter, Request, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, Any
from app.schemas.analysis import AnalyzeRequest
from app.services.analysis_service import analysis_service
from app.services.cache_service import analysis_cache
from app.utils.logger import logger
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

@router.post("/analyze")
@limiter.limit("10/minute")
async def analyze(request: Request, req: AnalyzeRequest):
    logger.info(f"Received analysis request for {req.company_name} (ticker: {req.ticker})", extra={"metadata": {"event": "incoming_request", "company_name": req.company_name, "ticker": req.ticker}})
    try:
        result = await analysis_service.analyze_company(req.company_name, req.ticker)
        # Store in cache so CompanyPage / ComparePage can reuse this run
        if req.ticker:
            analysis_cache.set(req.ticker, result)
        logger.info(f"Analysis completed successfully for {req.company_name}", extra={"metadata": {"event": "analysis_success", "company_name": req.company_name}})
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Internal error during analysis: {e}", extra={"metadata": {"event": "endpoint_failure", "error": str(e)}})
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/analyze/{ticker}")
async def websocket_analyze(websocket: WebSocket, ticker: str):
    await websocket.accept()
    logger.info(f"WebSocket connected for ticker: {ticker}")
    try:
        data = await websocket.receive_json()
        company_name = data.get("company_name", ticker)
        ticker_val = data.get("ticker", ticker)

        async def on_step(step_idx: int):
            logger.info(f"WebSocket step {step_idx} for {ticker}")
            await websocket.send_json({"type": "step", "step": step_idx})

        result = await analysis_service.analyze_company(company_name, ticker_val, on_step_cb=on_step)
        
        logger.info(f"WebSocket analysis complete for {ticker}. Sending results.")
        await websocket.send_json({"type": "result", "data": result})

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for {ticker}")
    except HTTPException as e:
        logger.warning(f"HTTP error in WebSocket: {e.detail}")
        await websocket.send_json({"type": "error", "message": e.detail})
    except Exception as e:
        logger.error(f"WebSocket error for {ticker}: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
