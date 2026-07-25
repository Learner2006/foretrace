from typing import Dict, Any, List
from app.clients.groq_client import groq_client
from app.schemas.analysis import BehavioralSummary, StructuralSignal
from pydantic import BaseModel
import json
import re
from app.schemas.extraction import CorporateKnowledgeGraph

class BusinessEngineOutput(BaseModel):
    behavioral_summary: BehavioralSummary
    behavioral_pattern_identified: str
    structural_signals: List[StructuralSignal]

# Every analysis engine owns a single responsibility (e.g. Business Strategy).
# This keeps prompts small, reduces token usage, and allows engines to evolve independently.
# It also heavily reduces LLM hallucinations since the model isn't trying to juggle
# financials, analogies, and risk vectors inside a single context window.
class BusinessEngine:
    async def run_deterministic(self, company_name: str, extraction_data: CorporateKnowledgeGraph) -> BusinessEngineOutput:
        """
        Pure Python mapping of Structural Pillars to legacy Behavioral Summary.
        """
        # We synthesize the narrative from the various structural pillars
        bm = extraction_data.business_model
        cp = extraction_data.competitive_position
        
        def _get_evidence(metrics_dict):
            if not metrics_dict:
                return "No evidence provided"
            first_metric = metrics_dict[list(metrics_dict.keys())[0]]
            return first_metric.evidence[0] if first_metric.evidence else "No evidence provided"

        summary = BehavioralSummary(
            observation=bm.description,
            evidence=_get_evidence(bm.metrics),
            why_it_matters=bm.why_it_matters,
            future_implication=bm.future_implication,
            confidence="High" if extraction_data.management_priorities.confidence > 0.8 else "Moderate",
            source=extraction_data.management_priorities.source_section,
            key_forces=bm.key_drivers + cp.key_drivers
        )
        
        return BusinessEngineOutput(
            behavioral_summary=summary,
            behavioral_pattern_identified="Transitioning structural profile",
            structural_signals=[]
        )

business_engine = BusinessEngine()
