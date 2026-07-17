from typing import List, Dict, Any
from app.clients.groq_client import groq_client
from pydantic import BaseModel
import json
import re

class MitigationLever(BaseModel):
    lever: str
    rationale: str
    analog_basis: str
    risk_if_ignored: str

class RecommendationEngineOutput(BaseModel):
    mitigation_levers: List[MitigationLever]

class RecommendationEngine:
    async def run(self, company_name: str, behavioral_summary: Dict[str, Any], analogs: List[Dict[str, Any]], risks: List[Dict[str, Any]]) -> RecommendationEngineOutput:
        prompt = f"""You are the Recommendation Engine for ForeTrace AI.
Given the behavioral analysis, risk signals, and historical analogs for {company_name}, recommend 2-4 strategic mitigation levers.

Company: {company_name}

Behavioral Summary:
{json.dumps(behavioral_summary, indent=2)}

Risk Signals:
{json.dumps(risks, indent=2)}

Analogs:
{json.dumps(analogs, indent=2)}

INSTRUCTIONS:
1. Provide actionable strategic levers.
2. Link each lever to an analog basis or risk factor.
3. Detail the risk if ignored.
4. Output strict JSON matching the schema below.

JSON Format:
{{
  "mitigation_levers": [
    {{
      "lever": "Strategic action recommendation",
      "rationale": "Why they should do this",
      "analog_basis": "Which analog or pattern this is based on",
      "risk_if_ignored": "What happens if they do nothing"
    }}
  ]
}}
"""
        response = await groq_client.chat_completion_json(
            prompt=prompt,
            system_message="You are a strategic recommendation engine. Return only valid JSON.",
            tier="reasoning"
        )
        try:
            return RecommendationEngineOutput(**response)
        except Exception as e:
            from app.utils.logger import logger
            logger.warning(f"Validation failed for RecommendationEngineOutput: {e}. Retrying...")
            retry_prompt = prompt + f"\n\nYour previous response failed validation: {str(e)}. Fix this specific issue and return corrected JSON."
            
            # Extract the tier from the previous call if possible, default to reasoning
            tier = "reasoning"
            
            retry_response = await groq_client.chat_completion_json(
                prompt=retry_prompt,
                system_message="Return only valid JSON.",
                tier=tier
            )
            return RecommendationEngineOutput(**retry_response)

recommendation_engine = RecommendationEngine()
