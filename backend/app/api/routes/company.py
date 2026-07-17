"""
Company and Compare routes for ForeTrace.

GET  /company/{ticker}         — lightweight company metadata (no LLM, instant)
POST /compare                  — parallel dual-analysis with diff object
GET  /cache/stats              — inspect cache state
DELETE /cache/{ticker}         — invalidate a cached result
"""
import asyncio
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.analysis_service import analysis_service
from app.services.sec_service import SECService
from app.services.cache_service import analysis_cache
from app.utils.logger import logger

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()
sec_service = SECService()


# ── Schemas ──────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    ticker_a: str
    company_a: Optional[str] = None
    ticker_b: str
    company_b: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

SIGNAL_DIMS = [
    {"key": "revenue_trend",          "label": "Revenue Trend",       "good": ["growing", "stable"],                "bad": ["declining"]},
    {"key": "debt_posture",           "label": "Debt Posture",        "good": ["low", "decreasing", "stable"],      "bad": ["increasing", "high"]},
    {"key": "cash_position",          "label": "Cash Position",       "good": ["strong", "healthy"],                "bad": ["weak", "critical"]},
    {"key": "margin_pressure",        "label": "Margin Pressure",     "good": [False],                              "bad": [True]},
    {"key": "layoffs_or_restructuring","label": "Restructuring Risk", "good": [False],                              "bad": [True]},
]


def score_signal(signals: Dict[str, Any], dim: Dict) -> Optional[str]:
    val = signals.get(dim["key"])
    if val is None:
        return None
    if val in dim["good"]:
        return "good"
    if val in dim["bad"]:
        return "bad"
    return "neutral"


def compute_advantage_score(result: Dict[str, Any]) -> int:
    """Returns a 0-100 score from structural quality, applying extreme skepticism to S&P 500 companies."""
    if not result:
        return 50
    signals = result.get("signals", {})
    mp = result.get("market_position", {})
    
    # start at 40 (skepticism bias: large companies are assumed competent, must prove excellence)
    score = 40
    
    # Market position modifiers (heavily weighted for structural rot)
    moat = mp.get("moat_strength") if isinstance(mp, dict) else None
    if moat == "strong": score += 20
    elif moat == "weak": score -= 20
    
    traj = mp.get("trajectory") if isinstance(mp, dict) else None
    if traj == "declining": score -= 25
    elif traj == "growing": score += 10
    
    good = sum(1 for d in SIGNAL_DIMS if score_signal(signals, d) == "good")
    bad  = sum(1 for d in SIGNAL_DIMS if score_signal(signals, d) == "bad")
    
    # asymmetric weighting: punish rot severely, reward basics lightly
    score += (good * 2)
    score -= (bad * 10)
    
    return max(0, min(100, score))


def build_head_to_head(data_a: Dict, data_b: Dict) -> List[Dict]:
    """Build per-dimension winner comparison."""
    sigs_a = data_a.get("signals") or {}
    sigs_b = data_b.get("signals") or {}
    rows = []
    for dim in SIGNAL_DIMS:
        sa = score_signal(sigs_a, dim)
        sb = score_signal(sigs_b, dim)
        if sa is None and sb is None:
            continue
        winner = None
        if sa == "good" and sb != "good":
            winner = "a"
        elif sb == "good" and sa != "good":
            winner = "b"
        rows.append({
            "dimension":  dim["label"],
            "value_a":    sigs_a.get(dim["key"]),
            "value_b":    sigs_b.get(dim["key"]),
            "score_a":    sa,
            "score_b":    sb,
            "winner":     winner,
        })
    return rows


def summarise_market_position(mp: Dict) -> Dict:
    return {
        "moat_strength":          mp.get("moat_strength"),
        "moat_strength_evidence": mp.get("moat_strength_evidence"),
        "trajectory":             mp.get("trajectory"),
        "relative_rank":          mp.get("relative_rank"),
        "key_dependency":         mp.get("key_dependency"),
        "momentum":               mp.get("momentum"),
    }


async def _run_or_cache(company_name: str, ticker: str) -> Dict[str, Any]:
    """Fetch from cache or run analysis pipeline."""
    cached = analysis_cache.get(ticker)
    if cached:
        return cached
    result = await analysis_service.analyze_company(company_name, ticker)
    analysis_cache.set(ticker, result)
    return result


# ── Routes ────────────────────────────────────────────────────────────────────

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
        return _shape_company_snapshot(cached, ticker)

    # Fall back to full pipeline (and cache result)
    try:
        result = await analysis_service.analyze_company(ticker, ticker)
        analysis_cache.set(ticker, result)
        return _shape_company_snapshot(result, ticker)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Company snapshot error for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _shape_company_snapshot(raw: Dict, ticker: str) -> Dict:
    bs = raw.get("behavioral_summary") or {}
    mp = raw.get("market_position") or {}
    sr = raw.get("structural_risk") or {}
    signals = raw.get("signals") or {}
    return {
        "ticker":              ticker,
        "company":             raw.get("company", ticker),
        "behavioral_summary":  {
            "observation":        bs.get("observation") or bs.get("what_is_happening", ""),
            "why_it_matters":     bs.get("why_it_matters", ""),
            "future_implication": bs.get("future_implication", ""),
            "confidence":         bs.get("confidence", "Moderate"),
        },
        "market_position":     summarise_market_position(mp),
        "structural_risk":     sr,
        "signals":             signals,
        "signal_score":        compute_advantage_score(raw),
        "structural_signals":  raw.get("structural_signals", []),
        "risk_signals":        raw.get("risk_signals", []),
        "mitigation_levers":   raw.get("mitigation_levers", []),
        "analogs":             raw.get("analogs", []),
        "behavioral_pattern":  raw.get("behavioral_pattern_identified", ""),
    }


@router.post("/compare")
@limiter.limit("5/minute")
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
        # Run both analyses concurrently (cache-aware)
        result_a, result_b = await asyncio.gather(
            _run_or_cache(name_a, ticker_a),
            _run_or_cache(name_b, ticker_b),
        )
    except Exception as e:
        logger.error(f"Compare pipeline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # Compute scores
    score_a = compute_advantage_score(result_a)
    score_b = compute_advantage_score(result_b)

    # Determine overall winner
    if score_a > score_b + 5:
        overall_winner = "a"
    elif score_b > score_a + 5:
        overall_winner = "b"
    else:
        overall_winner = "tie"

    head_to_head = build_head_to_head(result_a, result_b)
    wins_a = sum(1 for r in head_to_head if r["winner"] == "a")
    wins_b = sum(1 for r in head_to_head if r["winner"] == "b")

    return {
        "ticker_a": ticker_a,
        "ticker_b": ticker_b,
        "company_a": result_a.get("company", ticker_a),
        "company_b": result_b.get("company", ticker_b),
        "overall_winner": overall_winner,
        "score_a": score_a,
        "score_b": score_b,
        "wins_a": wins_a,
        "wins_b": wins_b,
        "head_to_head": head_to_head,
        "company_a_detail": _shape_company_snapshot(result_a, ticker_a),
        "company_b_detail": _shape_company_snapshot(result_b, ticker_b),
    }


# ── Cache management ──────────────────────────────────────────────────────────

@router.get("/cache/stats")
async def cache_stats():
    """Inspect the in-memory analysis cache."""
    return analysis_cache.stats()


@router.delete("/cache/{ticker}")
async def invalidate_cache(ticker: str):
    """Force-expire a cached result so the next request re-runs the pipeline."""
    analysis_cache.invalidate(ticker.upper())
    return {"invalidated": ticker.upper()}
