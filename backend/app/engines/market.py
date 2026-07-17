from app.clients.groq_client import groq_client
from app.schemas.analysis import MarketPosition
from pydantic import BaseModel
import json
import re

class MarketEngineOutput(BaseModel):
    market_position: MarketPosition

class MarketEngine:
    async def run(self, company_name: str, filing_text: str) -> MarketEngineOutput:
        prompt = f"""You are the Market Engine of the ForeTrace AI. You are a highly critical, skeptical strategist. You are exclusively analyzing top 200 / S&P 500 companies. 
Do NOT praise the company for being a "market leader" — everyone in this cohort is a leader in some way. Your job is to find the "rot inside": eroding moats, dangerous dependencies, and trailing momentum relative to upstarts.

Company: {company_name}

Filing Text:
{filing_text}

INSTRUCTIONS:
1. Assess the competitive position, moat strength, growth trajectory, relative standing with intense skepticism. Be ruthless.
2. If they are a leader, focus on how their moat is eroding or where they are vulnerable.
3. Every evidence MUST be a direct quote from the text.
4. Output strict JSON matching the schema below.

JSON Format:
{{
  "market_position": {{
    "moat_strength": "weak" | "moderate" | "strong",
    "moat_strength_evidence": "Filing quote explaining competitive moat strength.",
    "trajectory": "declining" | "stable" | "growing",
    "trajectory_evidence": "Filing quote justifying business trajectory.",
    "relative_rank": "laggard" | "challenger" | "leader" | "dominant",
    "relative_rank_evidence": "Filing quote justifying ranking relative to competitors.",
    "key_dependency": "One sentence on the biggest external dependency.",
    "momentum": "growing" | "stable" | "declining"
  }}
}}
"""
        response = await groq_client.chat_completion_json(
            prompt=prompt,
            system_message="You are a market analysis engine. Return only valid JSON.",
            tier="fast"
        )
        try:
            return MarketEngineOutput(**response)
        except Exception as e:
            from app.utils.logger import logger
            logger.warning(f"Validation failed for MarketEngineOutput: {e}. Retrying...")
            retry_prompt = prompt + f"\n\nYour previous response failed validation: {str(e)}. Fix this specific issue and return corrected JSON."
            
            # Extract the tier from the previous call if possible, default to reasoning
            tier = "reasoning"
            
            retry_response = await groq_client.chat_completion_json(
                prompt=retry_prompt,
                system_message="Return only valid JSON.",
                tier=tier
            )
            return MarketEngineOutput(**retry_response)

market_engine = MarketEngine()
