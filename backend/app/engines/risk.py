from typing import List
from app.clients.groq_client import groq_client
from app.schemas.analysis import RiskSignal
from pydantic import BaseModel
import json
import re

class RiskEngineOutput(BaseModel):
    risk_signals: List[RiskSignal]

class RiskEngine:
    async def run(self, company_name: str, filing_text: str) -> RiskEngineOutput:
        prompt = f"""You are the Risk Engine of the ForeTrace AI. Your task is to extract the highest-impact structural and execution risks from the SEC filing.

Company: {company_name}

Filing Text:
{filing_text}

INSTRUCTIONS:
1. Do not simply summarize Item 1A. Select only the 3-5 highest-impact risks.
2. Every evidence MUST be a direct quote from the text.
3. Output strict JSON matching the schema below.

JSON Format:
{{
  "risk_signals": [
    {{
      "observation": "Highest-impact risk title (e.g. Customer concentration risk in compute hardware)",
      "evidence": "Supporting filing evidence/details.",
      "why_it_matters": "Why it matters and potential business impact severity.",
      "future_implication": "What happens if this risk materializes.",
      "confidence": "High" | "Moderate" | "Low",
      "source": "Item 1A (Risk Factors)",
      "probability": "High" | "Medium" | "Low",
      "mitigation": "Management preparation/mitigation details from filing."
    }}
  ]
}}
"""
        response = await groq_client.chat_completion_json(
            prompt=prompt,
            system_message="You are a risk analysis engine. Return only valid JSON.",
            tier="fast"
        )
        try:
            return RiskEngineOutput(**response)
        except Exception as e:
            from app.utils.logger import logger
            logger.warning(f"Validation failed for RiskEngineOutput: {e}. Retrying...")
            retry_prompt = prompt + f"\n\nYour previous response failed validation: {str(e)}. Fix this specific issue and return corrected JSON."
            
            # Extract the tier from the previous call if possible, default to reasoning
            tier = "reasoning"
            
            retry_response = await groq_client.chat_completion_json(
                prompt=retry_prompt,
                system_message="Return only valid JSON.",
                tier=tier
            )
            return RiskEngineOutput(**retry_response)

risk_engine = RiskEngine()
