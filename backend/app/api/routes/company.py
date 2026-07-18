"""
Company and Compare routes for ForeTrace.

GET  /company/{ticker}         — lightweight company metadata (no LLM, instant)
POST /compare                  — parallel dual-analysis with diff object
GET  /cache/stats              — inspect cache state
DELETE /cache/{ticker}         — invalidate a cached result
"""
import asyncio
from fastapi import APIRouter, Request, HTTPException
from typing import Optional, List, Dict, Any

from app.services.analysis_service import analysis_service
from app.services.cache_service import analysis_cache
from app.utils.logger import logger
from app.utils.limiter import limiter
from app.schemas.analysis import CompareRequest

router = APIRouter()


@router.get("/company/{ticker}")
@limiter.limit("30/minute")
async def get_company(request: Request, ticker: str):
    """
    Lightweight company snapshot.
    Returns cached analysis if available (instant), otherwise runs the
    full pipeline once and caches the result.
    """
    ticker = ticker.upper().strip()
    logger.info(f"Company snapshot request for {ticker}")

    # Try cache first
    cached = analysis_cache.get(ticker)
    if cached:
        return analysis_service.shape_company_snapshot(cached, ticker)

    # Fall back to full pipeline (and cache result)
    try:
        result = await asyncio.wait_for(
            analysis_service.analyze_company(ticker, ticker),
            timeout=120.0
        )
        analysis_cache.set(ticker, result)
        return analysis_service.shape_company_snapshot(result, ticker)
    except asyncio.TimeoutError:
        logger.error(f"Company snapshot timeout for {ticker}")
        raise HTTPException(status_code=504, detail="Request timed out. Analysis took longer than 120 seconds.")
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Company snapshot error for {ticker}: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again later.")


@router.post("/compare")
@limiter.limit("10/minute")
async def compare_companies(request: Request, req: CompareRequest):
    """
    Run two analyses in parallel (or hit cache) and return a structured
    head-to-head diff object.
    """
    ticker_a = req.ticker_a.upper().strip()
    ticker_b = req.ticker_b.upper().strip()
    name_a   = req.company_a or ticker_a
    name_b   = req.company_b or ticker_b

    if ticker_a == ticker_b:
        raise HTTPException(status_code=400, detail="Cannot compare a company with itself.")

    logger.info(f"Compare request: {ticker_a} vs {ticker_b}")

    try:
        # Run both analyses concurrently (cache-aware) with a timeout
        return await asyncio.wait_for(
            analysis_service.compare_companies(ticker_a, ticker_b, name_a, name_b),
            timeout=120.0
        )
    except asyncio.TimeoutError:
        logger.error(f"Compare request timed out for {ticker_a} vs {ticker_b}")
        raise HTTPException(status_code=504, detail="Request timed out. Comparison took longer than 120 seconds.")
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Compare pipeline error: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again later.")


# ── Cache management ──────────────────────────────────────────────────────────

@router.get("/cache/stats")
@limiter.limit("30/minute")
async def cache_stats(request: Request):
    """Inspect the in-memory analysis cache."""
    return analysis_cache.stats()


@router.delete("/cache/{ticker}")
@limiter.limit("30/minute")
async def invalidate_cache(ticker: str, request: Request):
    """Force-expire a cached result so the next request re-runs the pipeline."""
    analysis_cache.invalidate(ticker.upper())
    return {"invalidated": ticker.upper()}
