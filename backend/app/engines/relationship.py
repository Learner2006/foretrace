from app.clients.groq_client import groq_client
from app.schemas.analysis import RelationshipContext
from pydantic import BaseModel
import json
import re

class RelationshipEngineOutput(BaseModel):
    relationship_context: RelationshipContext

class RelationshipEngine:
    async def run(self, company_name: str, filing_text: str) -> RelationshipEngineOutput:
        prompt = f"""You are the Relationship Engine of the ForeTrace AI. Your task is to extract ecosystem dependencies and relationship contexts from the SEC filing.

Company: {company_name}

Filing Text:
{filing_text}

INSTRUCTIONS:
1. Explain relationships and dependencies, supplier dependence, customer concentration, partner ecosystem.
2. Output strict JSON matching the schema below.

JSON Format:
{{
  "relationship_context": {{
    "linked_to": ["Key company/entity influencing trajectory"],
    "insight": "One analytical sentence explaining the relationship dynamics, detailing why it limits pricing power or accelerates growth."
  }}
}}
"""
        response = await groq_client.chat_completion_json(
            prompt=prompt,
            system_message="You are a relationship analysis engine. Return only valid JSON.",
            tier="fast"
        )
        try:
            return RelationshipEngineOutput(**response)
        except Exception as e:
            from app.utils.logger import logger
            logger.warning(f"Validation failed for RelationshipEngineOutput: {e}. Retrying...")
            retry_prompt = prompt + f"\n\nYour previous response failed validation: {str(e)}. Fix this specific issue and return corrected JSON."
            
            # Extract the tier from the previous call if possible, default to reasoning
            tier = "reasoning"
            
            retry_response = await groq_client.chat_completion_json(
                prompt=retry_prompt,
                system_message="Return only valid JSON.",
                tier=tier
            )
            return RelationshipEngineOutput(**retry_response)

relationship_engine = RelationshipEngine()
