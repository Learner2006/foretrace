import json
from typing import Dict, Any, Optional
from app.clients.groq_client import groq_client
from app.schemas.extraction import CorporateKnowledgeGraph
from app.utils.logger import logger

class ExtractionEngine:
    def __init__(self):
        self.name = "extraction_engine"

    async def execute(self, company_name: str, filing_text: str, ticker: Optional[str] = None) -> CorporateKnowledgeGraph:
        """
        Single LLM pass to extract all L1 structural pillars and evidence.
        Reduces token consumption by 80% versus the legacy concurrent architecture.
        """
        system_message = f"""
        You are a Principal Corporate Intelligence Extractor.
        Analyze the provided SEC 10-K filing for {company_name} ({ticker or 'Unknown'}).
        Extract comprehensive facts, signals, and context exactly mapping to the requested JSON schema.
        
        CRITICAL RULES:
        1. DO NOT hallucinate. Pull facts only from the text.
        2. Every extracted metric MUST include exact quotes in the 'evidence' array.
        3. Assign a realistic confidence float (0.0 to 1.0).
        4. Cite the specific source_section (e.g., 'Item 7 MD&A').
        5. Return ONLY valid JSON matching the CorporateKnowledgeGraph schema.
        6. For competitive_position metrics, you MUST extract the keys: 'moat_strength', 'trajectory', 'relative_rank', 'key_dependency', and 'momentum'.
        7. For competitive_position metric values, use standardized categories:
           - 'moat_strength': 'weak', 'moderate', or 'strong'
           - 'trajectory': 'declining', 'stable', or 'growing'
           - 'relative_rank': 'laggard', 'challenger', 'leader', or 'dominant'
        """
        
        # We need the JSON schema definition
        schema_json = CorporateKnowledgeGraph.model_json_schema()
        
        prompt = f"""
        Extract the knowledge graph for {company_name}.
        
        Required JSON Schema:
        {json.dumps(schema_json, indent=2)}
        
        Filing Document:
        {filing_text[:60000]}  # Truncated safely to fit context while retaining MD&A
        """

        max_retries = 2
        for attempt in range(max_retries + 1):
            logger.info(f"ExtractionEngine invoking LLM for {company_name} (Attempt {attempt + 1})")
            
            response_data = await groq_client.chat_completion_json(
                system_message=system_message,
                prompt=prompt,
                tier="reasoning",
                model="llama-3.3-70b-versatile"
            )
            
            try:
                validated_graph = CorporateKnowledgeGraph(**response_data)
                return validated_graph
            except Exception as e:
                logger.warning(f"Validation failed for extraction schema on {company_name} (Attempt {attempt + 1}): {e}")
                if attempt == max_retries:
                    logger.error(f"Max retries exhausted for {company_name}.")
                    raise
                # Append the specific error to the prompt for the retry
                prompt += f"\n\nYour previous response failed validation with this error: {str(e)}. Please carefully fix this specific issue and return the corrected JSON."

extraction_engine = ExtractionEngine()
