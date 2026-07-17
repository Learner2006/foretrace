from typing import Dict, Any, List
from app.clients.groq_client import groq_client
from app.schemas.analysis import Signals, StructuralSignal
from pydantic import BaseModel
import json
import re

class FinancialEngineOutput(BaseModel):
    signals: Signals
    structural_signals: List[StructuralSignal]

class FinancialEngine:
    async def run(self, company_name: str, filing_text: str) -> FinancialEngineOutput:
        prompt = f"""You are the Financial Engine of the ForeTrace AI. You are a hyper-critical, deeply skeptical forensic analyst. You are exclusively analyzing top 200 / S&P 500 companies. 
Do NOT praise the company for having high revenue or cash—that is the bare minimum for this tier. Your job is to find the "rot inside": structural vulnerabilities, declining unit economics, unsustainable capital allocation, margin compression masked by accounting, and hidden leverage.

Company: {company_name}

Filing Text:
{filing_text}

INSTRUCTIONS:
1. Assess the revenue trend, debt posture, expansion signals, margin pressure, layoffs/restructuring, and cash position with extreme skepticism.
2. Generate 1-2 financial structural signals (e.g., fundamental shifts in unit economics, capital allocation, or margin structure). Focus on the NEGATIVE trade-offs or hidden costs of their current strategy.
3. Every evidence MUST be a direct quote from the text.
4. Output strict JSON matching the schema below.


JSON Format:
{{
  "signals": {{
    "revenue_trend": "declining" | "growing" | "stable" | "uncertain",
    "debt_posture": "increasing" | "decreasing" | "stable",
    "expansion_signals": ["keyword1", "keyword2"],
    "margin_pressure": true | false,
    "layoffs_or_restructuring": true | false,
    "cash_position": "strong" | "weak" | "unknown"
  }},
  "structural_signals": [
    {{
      "observation": "Specific metric or trend shift (e.g. accelerating Capex/Revenue ratio)",
      "trend": "rising" | "stable" | "declining",
      "evidence": "Direct quote or specific citation from the 10-K.",
      "why_it_matters": "Specific business impact and strategic tension.",
      "future_implication": "Long-term effect on business model.",
      "possible_invalidation": "What specific data point/event would prove this signal wrong.",
      "confidence": "High" | "Moderate" | "Low",
      "source": "Item 7 (MD&A) or Item 1"
    }}
  ]
}}
"""
        response = await groq_client.chat_completion_json(
            prompt=prompt,
            system_message="You are a financial analysis engine. Return only valid JSON.",
            tier="fast"
        )
        try:
            return FinancialEngineOutput(**response)
        except Exception as e:
            from app.utils.logger import logger
            logger.warning(f"Validation failed for FinancialEngineOutput: {e}. Retrying...")
            retry_prompt = prompt + f"\n\nYour previous response failed validation: {str(e)}. Fix this specific issue and return corrected JSON."
            
            # Extract the tier from the previous call if possible, default to reasoning
            tier = "reasoning"
            
            retry_response = await groq_client.chat_completion_json(
                prompt=retry_prompt,
                system_message="Return only valid JSON.",
                tier=tier
            )
            return FinancialEngineOutput(**retry_response)

financial_engine = FinancialEngine()
