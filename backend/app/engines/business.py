from typing import Dict, Any, List
from app.clients.groq_client import groq_client
from app.schemas.analysis import BehavioralSummary, StructuralSignal
from pydantic import BaseModel
import json
import re

class BusinessEngineOutput(BaseModel):
    behavioral_summary: BehavioralSummary
    behavioral_pattern_identified: str
    structural_signals: List[StructuralSignal]

# Every analysis engine owns a single responsibility (e.g. Business Strategy).
# This keeps prompts small, reduces token usage, and allows engines to evolve independently.
# It also heavily reduces LLM hallucinations since the model isn't trying to juggle
# financials, analogies, and risk vectors inside a single context window.
class BusinessEngine:
    async def run(self, company_name: str, filing_text: str) -> BusinessEngineOutput:
        prompt = f"""You are the Business Engine of the ForeTrace AI. You are a highly critical, skeptical strategist. You are exclusively analyzing top 200 / S&P 500 companies. 
Do NOT praise the company for being a "market leader" or having "strong products"—that is the bare minimum for this tier. Your job is to find the "rot inside": strategic missteps, saturated core markets, desperate pivots, and structural trade-offs that management is trying to hide.

Company: {company_name}

Filing Text:
{filing_text}

INSTRUCTIONS:
1. Identify the core structural shift under way in the business model, focusing on the pain points forcing this shift.
2. Generate 1-2 business/operational structural signals (e.g., changes in customer strategy, operational priorities, go-to-market). Highlight the strategic tension.
3. Identify a high-level abstract behavioral pattern name (e.g., "Margin Protection Pivot", "Growth at all costs", "Desperate M&A").
4. Every evidence MUST be a direct quote from the text.
5. Output strict JSON matching the schema below.

JSON Format:
{{
  "behavioral_summary": {{
    "observation": "The core structural shift under way.",
    "evidence": "Direct quote or specific filing citation supporting the shift.",
    "why_it_matters": "Specific business model tension or economic tradeoff.",
    "future_implication": "Long-term projection of what this shift leads to.",
    "confidence": "High" | "Moderate" | "Low",
    "source": "Item 7 (MD&A) or Item 1A",
    "key_forces": ["specific force 1", "specific force 2"]
  }},
  "behavioral_pattern_identified": "Abstract pattern name",
  "structural_signals": [
    {{
      "observation": "Specific operational shift",
      "trend": "rising" | "stable" | "declining",
      "evidence": "Direct quote or specific citation from the 10-K.",
      "why_it_matters": "Specific business impact.",
      "future_implication": "Long-term effect.",
      "possible_invalidation": "What specific data point/event would prove this wrong.",
      "confidence": "High" | "Moderate" | "Low",
      "source": "Item 7 (MD&A) or Item 1"
    }}
  ]
}}
"""
        response = await groq_client.chat_completion_json(
            prompt=prompt,
            system_message="You are a business analysis engine. Return only valid JSON.",
            tier="reasoning"
        )
        try:
            return BusinessEngineOutput(**response)
        except Exception as e:
            from app.utils.logger import logger
            logger.warning(f"Validation failed for BusinessEngineOutput: {e}. Retrying...")
            retry_prompt = prompt + f"\n\nYour previous response failed validation: {str(e)}. Fix this specific issue and return corrected JSON."
            
            # Extract the tier from the previous call if possible, default to reasoning
            tier = "reasoning"
            
            retry_response = await groq_client.chat_completion_json(
                prompt=retry_prompt,
                system_message="Return only valid JSON.",
                tier=tier
            )
            return BusinessEngineOutput(**retry_response)

business_engine = BusinessEngine()
