from typing import Dict, Any, Optional, Callable
from app.engines.composer import composer_engine

class AnalysisService:
    async def analyze_company(self, company_name: str, ticker: Optional[str] = None, on_step_cb: Optional[Callable[[int], Any]] = None) -> Dict[str, Any]:
        return await composer_engine.run_pipeline(company_name, ticker, on_step_cb)

analysis_service = AnalysisService()
