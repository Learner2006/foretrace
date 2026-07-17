from typing import List, Dict, Any
from app.clients.groq_client import groq_client
from app.schemas.analysis import Analog
from pydantic import BaseModel
import json
import re

class AnalogEngineOutput(BaseModel):
    analogs: List[Analog]

class AnalogEngine:
    async def run(self, company_name: str, behavioral_summary: Dict[str, Any], structural_signals: List[Dict[str, Any]]) -> AnalogEngineOutput:
        prompt = f"""You are the Analog Engine of the ForeTrace AI. Your task is to find historical analogies (successes and failures) for the current company based on its structural shifts.

Company: {company_name}
Behavioral Summary:
{json.dumps(behavioral_summary, indent=2)}

Structural Signals:
{json.dumps(structural_signals, indent=2)}

INSTRUCTIONS:
1. Every analog must be evidence-driven. Similarity must be based on measurable business characteristics (revenue acceleration, margin trend, capital allocation, customer concentration, platform transition, regulatory pressure, ecosystem strength). 
2. Never match companies simply because they operate in similar industries.
3. Generate 1 success analog and 1 failure analog.
4. Output strict JSON matching the schema below.

JSON Format:
{{
  "analogs": [
    {{
      "type": "success",
      "company": "Real company name",
      "analog_ticker": "TICKER or null",
      "year": 2018,
      "similarity_score": 78,
      "confidence": 85,
      "corpusPercentile": 92,
      "matchCount": 14,
      "what_they_resembled": "Why this structurally matches.",
      "action_taken": "What they did structurally.",
      "outcome": "What happened — with precise historical metrics.",
      "key_difference": "One structural difference that made them succeed.",
      "lessons_learned": "What {company_name} can learn.",
      "invalidation_triggers": "What could invalidate this comparison.",
      "citation": "Source",
      "similarity_basis": [
        "signal_name: value — explanation"
      ]
    }},
    {{
      "type": "failure",
      "company": "Real company name",
      "analog_ticker": "TICKER or null",
      "year": 2017,
      "similarity_score": 65,
      "confidence": 70,
      "corpusPercentile": 85,
      "matchCount": 14,
      "what_they_resembled": "Why this structurally matches.",
      "action_taken": "What they did wrong structurally.",
      "outcome": "What happened — with precise historical metrics.",
      "key_difference": "One thing that caused failure to watch for.",
      "lessons_learned": "What {company_name} can learn.",
      "invalidation_triggers": "What could invalidate this comparison.",
      "citation": "Source",
      "similarity_basis": [
        "signal_name: value — explanation"
      ]
    }}
  ]
}}
"""
        response = await groq_client.chat_completion_json(
            prompt=prompt,
            system_message="You are an analog reasoning engine. Return only valid JSON.",
            tier="reasoning"
        )
        try:
            return AnalogEngineOutput(**response)
        except Exception as e:
            from app.utils.logger import logger
            logger.warning(f"Validation failed for AnalogEngineOutput: {e}. Retrying...")
            retry_prompt = prompt + f"\n\nYour previous response failed validation: {str(e)}. Fix this specific issue and return corrected JSON."
            
            # Extract the tier from the previous call if possible, default to reasoning
            tier = "reasoning"
            
            retry_response = await groq_client.chat_completion_json(
                prompt=retry_prompt,
                system_message="Return only valid JSON.",
                tier=tier
            )
            return AnalogEngineOutput(**retry_response)

analog_engine = AnalogEngine()
