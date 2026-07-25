from typing import Any
from app.clients.groq_client import groq_client
from app.schemas.analysis import MarketPosition
from pydantic import BaseModel
import json
import re
from app.schemas.extraction import CorporateKnowledgeGraph

def _normalize_moat(val: Any) -> str:
    s = str(val).lower()
    if any(w in s for w in ["strong", "high", "dominant", "wide", "deep"]):
        return "strong"
    if any(w in s for w in ["weak", "low", "eroding", "narrow", "none"]):
        return "weak"
    return "moderate"

def _normalize_trajectory(val: Any) -> str:
    s = str(val).lower()
    if any(w in s for w in ["grow", "expand", "increas", "up", "positive", "accelerat"]):
        return "growing"
    if any(w in s for w in ["declin", "drop", "decreas", "down", "contract", "fall"]):
        return "declining"
    return "stable"

def _normalize_rank(val: Any) -> str:
    s = str(val).lower()
    if any(w in s for w in ["dominant", "monopol"]):
        return "dominant"
    if any(w in s for w in ["leader", "top", "first", "number one", "#1"]):
        return "leader"
    if any(w in s for w in ["laggard", "trail", "behind", "last"]):
        return "laggard"
    return "challenger"

class MarketEngineOutput(BaseModel):
    market_position: MarketPosition

class MarketEngine:
    async def run_deterministic(self, company_name: str, extraction_data: CorporateKnowledgeGraph) -> MarketEngineOutput:
        """
        Pure Python mapping of Structural Pillars to legacy Market Position.
        """
        cp = extraction_data.competitive_position
        
        def _get_val(metrics_dict, key, default):
            return metrics_dict[key].value if key in metrics_dict else default
            
        def _get_ev(metrics_dict, key, default):
            return metrics_dict[key].evidence[0] if key in metrics_dict and metrics_dict[key].evidence else default

        raw_moat = _get_val(cp.metrics, "moat_strength", "strong")
        raw_traj = _get_val(cp.metrics, "trajectory", "growing")
        raw_rank = _get_val(cp.metrics, "relative_rank", "leader")

        return MarketEngineOutput(
            market_position=MarketPosition(
                moat_strength=_normalize_moat(raw_moat),
                moat_strength_evidence=_get_ev(cp.metrics, "moat_strength", cp.description),
                trajectory=_normalize_trajectory(raw_traj),
                trajectory_evidence=_get_ev(cp.metrics, "trajectory", cp.future_implication),
                relative_rank=_normalize_rank(raw_rank),
                relative_rank_evidence=_get_ev(cp.metrics, "relative_rank", cp.why_it_matters),
                key_dependency=str(_get_val(cp.metrics, "key_dependency", "Unknown")),
                momentum=str(_get_val(cp.metrics, "momentum", "stable"))
            )
        )

market_engine = MarketEngine()
