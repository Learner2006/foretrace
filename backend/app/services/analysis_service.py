from typing import Dict, Any, Optional, Callable, List
import asyncio
from app.engines.composer import composer_engine
from app.services.cache_service import analysis_cache
from app.utils.logger import logger

SIGNAL_DIMS = [
    {"key": "revenue_trend",          "label": "Revenue Trend",       "good": ["growing", "stable"],                "bad": ["declining"]},
    {"key": "debt_posture",           "label": "Debt Posture",        "good": ["low", "decreasing", "stable"],      "bad": ["increasing", "high"]},
    {"key": "cash_position",          "label": "Cash Position",       "good": ["strong", "healthy"],                "bad": ["weak", "critical"]},
    {"key": "margin_pressure",        "label": "Margin Pressure",     "good": [False],                              "bad": [True]},
    {"key": "layoffs_or_restructuring","label": "Restructuring Risk", "good": [False],                              "bad": [True]},
]


class AnalysisService:
    async def analyze_company(self, company_name: str, ticker: Optional[str] = None, on_step_cb: Optional[Callable[[int], Any]] = None) -> Dict[str, Any]:
        return await composer_engine.run_pipeline(company_name, ticker, on_step_cb)



    @staticmethod
    def score_signal(signals: Dict[str, Any], dim: Dict) -> Optional[str]:
        val = signals.get(dim["key"])
        if val is None:
            return None
        if val in dim["good"]:
            return "good"
        if val in dim["bad"]:
            return "bad"
        return "neutral"

    def compute_advantage_score(self, result: Dict[str, Any]) -> int:
        if not result:
            return 50
        signals = result.get("signals", {})
        mp = result.get("market_position", {})
        
        score = 40
        moat = mp.get("moat_strength") if isinstance(mp, dict) else None
        if moat == "strong": score += 20
        elif moat == "weak": score -= 20
        
        traj = mp.get("trajectory") if isinstance(mp, dict) else None
        if traj == "declining": score -= 25
        elif traj == "growing": score += 10
        
        good = sum(1 for d in SIGNAL_DIMS if self.score_signal(signals, d) == "good")
        bad  = sum(1 for d in SIGNAL_DIMS if self.score_signal(signals, d) == "bad")
        
        score += (good * 2)
        score -= (bad * 10)
        
        return max(0, min(100, score))

    @staticmethod
    def summarise_market_position(mp: Dict) -> Dict:
        return {
            "moat_strength":          mp.get("moat_strength"),
            "moat_strength_evidence": mp.get("moat_strength_evidence"),
            "trajectory":             mp.get("trajectory"),
            "relative_rank":          mp.get("relative_rank"),
            "key_dependency":         mp.get("key_dependency"),
            "momentum":               mp.get("momentum"),
        }

    def shape_company_snapshot(self, raw: Dict, ticker: str) -> Dict:
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
            "market_position":     self.summarise_market_position(mp),
            "structural_risk":     sr,
            "signals":             signals,
            "signal_score":        self.compute_advantage_score(raw),
            "structural_signals":  raw.get("structural_signals", []),
            "risk_signals":        raw.get("risk_signals", []),
            "mitigation_levers":   raw.get("mitigation_levers", []),
            "analogs":             raw.get("analogs", []),
            "behavioral_pattern":  raw.get("behavioral_pattern_identified", ""),
        }

analysis_service = AnalysisService()

