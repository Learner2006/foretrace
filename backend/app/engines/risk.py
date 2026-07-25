from typing import List
from app.clients.groq_client import groq_client
from app.schemas.analysis import RiskSignal
from pydantic import BaseModel
import json
import re
from app.schemas.extraction import CorporateKnowledgeGraph

class RiskEngineOutput(BaseModel):
    risk_signals: List[RiskSignal]

class RiskEngine:
    async def run_deterministic(self, company_name: str, extraction_data: CorporateKnowledgeGraph) -> RiskEngineOutput:
        """
        Pure Python mapping of Structural Pillars to legacy Risk Signals.
        """
        rp = extraction_data.risk_profile
        
        # Build 1-2 risk signals derived from the risk profile metrics
        risk_signals = []
        for key, metric in rp.metrics.items():
            risk_signals.append(
                RiskSignal(
                    observation=f"Identified risk in {key}",
                    evidence=metric.evidence[0] if metric.evidence else "No specific evidence cited.",
                    why_it_matters=rp.why_it_matters,
                    future_implication=rp.future_implication,
                    confidence="High" if metric.confidence > 0.8 else "Moderate",
                    source=metric.source_section,
                    probability="High" if metric.confidence > 0.8 else "Medium",
                    mitigation=rp.possible_invalidation
                )
            )
            
        # Fallback if no specific metrics were returned by the LLM
        if not risk_signals:
            risk_signals.append(
                RiskSignal(
                    observation="General structural risk profile",
                    evidence="No specific evidence extracted.",
                    why_it_matters=rp.why_it_matters,
                    future_implication=rp.future_implication,
                    confidence="Low",
                    source="Item 1A",
                    probability="Unknown",
                    mitigation=rp.possible_invalidation
                )
            )
            
        return RiskEngineOutput(risk_signals=risk_signals[:2])

risk_engine = RiskEngine()
