from app.clients.groq_client import groq_client
from app.schemas.analysis import MarketPosition
from pydantic import BaseModel
import json
import re
from app.schemas.extraction import CorporateKnowledgeGraph

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

        return MarketEngineOutput(
            market_position=MarketPosition(
                moat_strength=_get_val(cp.metrics, "moat_strength", "strong"),
                moat_strength_evidence=_get_ev(cp.metrics, "moat_strength", cp.description),
                trajectory=_get_val(cp.metrics, "trajectory", "growing"),
                trajectory_evidence=_get_ev(cp.metrics, "trajectory", cp.future_implication),
                relative_rank=_get_val(cp.metrics, "relative_rank", "leader"),
                relative_rank_evidence=_get_ev(cp.metrics, "relative_rank", cp.why_it_matters),
                key_dependency=_get_val(cp.metrics, "key_dependency", "Unknown"),
                momentum=_get_val(cp.metrics, "momentum", "stable")
            )
        )

market_engine = MarketEngine()
