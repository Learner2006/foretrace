import asyncio
from typing import Dict, Any, Optional, Callable
from app.utils.logger import logger
from app.services.sec_service import sec_service
from app.engines.financial import financial_engine
from app.engines.business import business_engine
from app.engines.risk import risk_engine
from app.engines.relationship import relationship_engine
from app.engines.market import market_engine

class ComposerEngine:
    @staticmethod
    def _compute_confidence(business_out: Dict[str, Any], analog_out: Dict[str, Any], all_structural_signals: list) -> tuple[str, str]:
        score = 0
        reasons = []
        
        if business_out.get("behavioral_pattern_identified") and business_out.get("behavioral_pattern_identified") != "Unknown":
            score += 1
            reasons.append("Clear structural behavioral pattern identified")
        else:
            reasons.append("Behavioral pattern is ambiguous")
            
        if len(all_structural_signals) >= 3:
            score += 1
            reasons.append(f"Strong evidence base ({len(all_structural_signals)} distinct structural signals extracted)")
        else:
            reasons.append(f"Weak evidence base (only {len(all_structural_signals)} structural signals extracted)")
            
        analogs = analog_out.get("analogs", [])
        if len(analogs) > 0:
            score += 1
            reasons.append("High-conviction historical analogs matched")
        else:
            reasons.append("No historical analogs matched current trajectory")
            
        reason_str = " · ".join(reasons)
        # max possible score is 3 (pattern + evidence + analogs)
        if score == 3:
            return "High", reason_str
        elif score == 2:
            return "Moderate", reason_str
        else:
            return "Low", reason_str

    @staticmethod
    def _compute_zscore_proxy(signals: Dict[str, Any]) -> Dict[str, Any]:
        score = 100
        active_factors = []
        if signals.get("revenue_trend") == "declining":
            score -= 25
            active_factors.append("Revenue is declining")
        if signals.get("debt_posture") == "increasing":
            score -= 20
            active_factors.append("Debt load is growing")
        if signals.get("cash_position") == "weak":
            score -= 25
            active_factors.append("Cash position is weak")
        if signals.get("margin_pressure") is True:
            score -= 15
            active_factors.append("Margin pressure detected")
        if signals.get("layoffs_or_restructuring") is True:
            score -= 15
            active_factors.append("Active restructuring underway")

        # pseudo-z-score: starts at 100, drops per penalty. <40 is distress.
        if score >= 70:
            return {"zone": "Safe Zone", "score": score, "reason": "No major structural distress signals.", "active_factors": active_factors}
        if score >= 40:
            return {"zone": "Grey Zone", "score": score, "reason": "Some structural stress — monitor closely.", "active_factors": active_factors}
        return {"zone": "Distress Zone", "score": score, "reason": "Multiple distress signals active.", "active_factors": active_factors}

    async def run_pipeline(self, company_name: str, ticker: Optional[str] = None, on_step_cb: Optional[Callable] = None) -> Dict[str, Any]:
        if on_step_cb:
            await on_step_cb(0)
            
        filing_text = await sec_service.fetch_company_filing(company_name, ticker)
        
        if on_step_cb:
            await on_step_cb(1)
            
        logger.info(f"Running Unified Extraction Engine for {company_name}")
        from app.engines.extraction import extraction_engine
        from app.engines.strategic_synthesis import strategic_synthesis_engine
        
        try:
            extraction_data = await extraction_engine.execute(company_name, filing_text, ticker)
        except Exception as e:
            logger.error(f"Extraction failed for {company_name}: {e}")
            return {
                "company": company_name,
                "behavioral_summary": {},
                "behavioral_pattern_identified": "Extraction Failed",
                "risk_signals": [],
                "analogs": [],
                "mitigation_levers": [],
                "relationship_context": {},
                "chart_data": [],
                "structural_risk": {"zone": "Unknown", "score": 0, "reason": "Data unavailable", "active_factors": []},
                "signals": {},
                "market_position": {},
                "structural_signals": [],
                "match_count": 0
            }
        
        if on_step_cb:
            await on_step_cb(2)
        
        logger.info(f"Running Deterministic Engines for {company_name}")
        financial_out = (await financial_engine.run_deterministic(company_name, extraction_data)).model_dump()
        business_out = (await business_engine.run_deterministic(company_name, extraction_data)).model_dump()
        risk_out = (await risk_engine.run_deterministic(company_name, extraction_data)).model_dump()
        relationship_out = (await relationship_engine.run_deterministic(company_name, extraction_data)).model_dump()
        market_out = (await market_engine.run_deterministic(company_name, extraction_data)).model_dump()

        # Combine structural signals
        all_structural_signals = financial_out.get("structural_signals", []) + business_out.get("structural_signals", [])
        
        logger.info(f"Running Level 2 Strategic Synthesis for {company_name}")
        try:
            deterministic_outputs = {
                "risk_score": self._compute_zscore_proxy(financial_out.get("signals", {})).get("score", 50)
            }
            synthesis_out = (await strategic_synthesis_engine.execute(company_name, extraction_data.model_dump(), deterministic_outputs)).model_dump()
            analog_out = {"analogs": synthesis_out.get("analogs", [])}
            rec_out = {"mitigation_levers": synthesis_out.get("mitigation_levers", [])}
        except Exception as e:
            logger.error(f"Strategic Synthesis failed: {e}")
            analog_out = {"analogs": []}
            rec_out = {"mitigation_levers": []}
        
        if on_step_cb:
            await on_step_cb(3)
            
        confidence_level, confidence_reason = self._compute_confidence(business_out, analog_out, all_structural_signals)
        behavioral_summary = business_out.get("behavioral_summary", {})
        behavioral_summary["confidence"] = confidence_level
        behavioral_summary["confidence_reason"] = confidence_reason
        
        signals = financial_out.get("signals", {})
        structural_risk = self._compute_zscore_proxy(signals)
        
        final_report = {
            "company": company_name,
            "behavioral_summary": behavioral_summary,
            "behavioral_pattern_identified": business_out.get("behavioral_pattern_identified", ""),
            "risk_signals": risk_out.get("risk_signals", []),
            "analogs": analog_out.get("analogs", []),
            "mitigation_levers": rec_out.get("mitigation_levers", []),
            "relationship_context": relationship_out.get("relationship_context", {}),
            "chart_data": [],
            "structural_risk": structural_risk,
            "signals": financial_out.get("signals", {}),
            "market_position": market_out.get("market_position"),
            "structural_signals": all_structural_signals,
            "match_count": len(analog_out.get("analogs", []))
        }
        
        return final_report

composer_engine = ComposerEngine()
