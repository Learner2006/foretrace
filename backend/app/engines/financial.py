from typing import Dict, Any, List
from app.clients.groq_client import groq_client
from app.schemas.analysis import Signals, StructuralSignal
from pydantic import BaseModel
import json
import re
from app.schemas.extraction import CorporateKnowledgeGraph

class FinancialEngineOutput(BaseModel):
    signals: Signals
    structural_signals: List[StructuralSignal]

class FinancialEngine:
    async def run_deterministic(self, company_name: str, extraction_data: CorporateKnowledgeGraph) -> FinancialEngineOutput:
        """
        Pure Python mapping of Structural Pillars to legacy Financial Signals.
        """
        # Safely extract metrics from the Business Model and Capital Allocation pillars
        bm = extraction_data.business_model.metrics
        ca = extraction_data.capital_allocation.metrics
        op = extraction_data.operational_discipline.metrics
        
        # Derive generic legacy fields from the complex EvidenceObjects
        def _get_val(metrics_dict, key, default):
            return metrics_dict[key].value if key in metrics_dict else default
            
        signals = Signals(
            revenue_trend=_get_val(bm, "revenue_trend", "stable"),
            debt_posture=_get_val(ca, "debt_posture", "stable"),
            expansion_signals=extraction_data.business_model.key_drivers,
            margin_pressure=bool("pressure" in str(_get_val(op, "margin", "")).lower()),
            layoffs_or_restructuring=bool("layoff" in str(_get_val(op, "restructuring", "")).lower() or "restructur" in str(_get_val(op, "restructuring", "")).lower()),
            cash_position=_get_val(ca, "cash_position", "unknown"),
            capex_trend=_get_val(ca, "capex_trend", "stable")
        )
        
        def _get_evidence(metrics_dict):
            if not metrics_dict:
                return "No specific evidence."
            first_metric = metrics_dict[list(metrics_dict.keys())[0]]
            return first_metric.evidence[0] if first_metric.evidence else "No specific evidence."

        structural_signals = [
            StructuralSignal(
                observation=extraction_data.capital_allocation.description,
                trend="stable",
                evidence=_get_evidence(ca),
                why_it_matters=extraction_data.capital_allocation.why_it_matters,
                future_implication=extraction_data.capital_allocation.future_implication,
                possible_invalidation=extraction_data.capital_allocation.possible_invalidation,
                confidence="High",
                source=ca[list(ca.keys())[0]].source_section if ca else "Item 7"
            )
        ]
        
        return FinancialEngineOutput(signals=signals, structural_signals=structural_signals)

financial_engine = FinancialEngine()
