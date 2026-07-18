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

    async def _run_or_cache(self, company_name: str, ticker: str, on_step_cb: Optional[Callable[[int], Any]] = None) -> Dict[str, Any]:
        cached = analysis_cache.get(ticker)
        if cached:
            if on_step_cb:
                await on_step_cb(3) # trigger completion step
            return cached
        result = await self.analyze_company(company_name, ticker, on_step_cb)
        analysis_cache.set(ticker, result)
        return result

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

    def build_head_to_head(self, data_a: Dict, data_b: Dict) -> List[Dict]:
        sigs_a = data_a.get("signals") or {}
        sigs_b = data_b.get("signals") or {}
        rows = []
        for dim in SIGNAL_DIMS:
            sa = self.score_signal(sigs_a, dim)
            sb = self.score_signal(sigs_b, dim)
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

    async def compare_companies(
        self,
        ticker_a: str,
        ticker_b: str,
        name_a: str,
        name_b: str,
        on_step_a: Optional[Callable[[int], Any]] = None,
        on_step_b: Optional[Callable[[int], Any]] = None
    ) -> Dict[str, Any]:
        ticker_a = ticker_a.upper().strip()
        ticker_b = ticker_b.upper().strip()

        result_a, result_b = await asyncio.gather(
            self._run_or_cache(name_a, ticker_a, on_step_a),
            self._run_or_cache(name_b, ticker_b, on_step_b),
        )

        score_a = self.compute_advantage_score(result_a)
        score_b = self.compute_advantage_score(result_b)

        if score_a > score_b + 5:
            overall_winner = "a"
        elif score_b > score_a + 5:
            overall_winner = "b"
        else:
            overall_winner = "tie"

        head_to_head = self.build_head_to_head(result_a, result_b)
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
            "company_a_detail": self.shape_company_snapshot(result_a, ticker_a),
            "company_b_detail": self.shape_company_snapshot(result_b, ticker_b),
        }

analysis_service = AnalysisService()
