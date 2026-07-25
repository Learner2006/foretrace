import json
from typing import Dict, Any, List
from app.clients.groq_client import groq_client
from app.schemas.analysis import Analog, MitigationLever
from pydantic import BaseModel
from app.utils.logger import logger

class StrategicSynthesisOutput(BaseModel):
    analogs: List[Analog]
    mitigation_levers: List[MitigationLever]

class StrategicSynthesisEngine:
    def __init__(self):
        self.name = "strategic_synthesis_engine"

    async def execute(self, company_name: str, extraction_data: Dict[str, Any], deterministic_outputs: Dict[str, Any]) -> StrategicSynthesisOutput:
        """
        L2 Reasoning engine. Consumes the structural pillars (extraction_data) and 
        deterministic Python outputs to synthesize deep analogs and recommendations.
        """
        system_message = f"""
        You are the Strategic Synthesis Engine for ForeTrace AI.
        
        Analyze {company_name} using its extracted structural pillars and calculated metrics.
        Your goal is true Structural Intelligence: determine what kind of company this is becoming.
        
        CRITICAL RULES:
        1. Analogs: Provide 1 Success and 1 Failure historical analog. Similarity MUST be based on the provided structural pillars, not just industry overlap.
        2. Mitigations: Recommend 2-4 strategic levers. Every lever MUST be explicitly tied back to the risk_if_ignored.
        3. Explainability: Your 'similarity_basis' and 'analog_basis' fields must explicitly cite the evidence from the input data.
        4. Return ONLY valid JSON matching the StrategicSynthesisOutput schema.
        """
        
        # Merge all inputs into a single context payload
        context_payload = {
            "structural_knowledge_graph": extraction_data,
            "deterministic_calculated_signals": deterministic_outputs
        }
        
        schema_json = StrategicSynthesisOutput.model_json_schema()
        
        prompt = f"""
        Generate the strategic synthesis for {company_name}.
        
        Required JSON Schema:
        {json.dumps(schema_json, indent=2)}
        
        Company Context:
        {json.dumps(context_payload, indent=2)}
        """

        max_retries = 2
        for attempt in range(max_retries + 1):
            logger.info(f"StrategicSynthesisEngine invoking L2 reasoning for {company_name} (Attempt {attempt + 1})")
            
            response_data = await groq_client.chat_completion_json(
                system_message=system_message,
                prompt=prompt,
                tier="reasoning",
                model="llama-3.3-70b-versatile"
            )
            
            try:
                validated_synthesis = StrategicSynthesisOutput(**response_data)
                return validated_synthesis
            except Exception as e:
                logger.warning(f"Validation failed for synthesis schema on {company_name} (Attempt {attempt + 1}): {e}")
                if attempt == max_retries:
                    logger.error(f"Max retries exhausted for {company_name}.")
                    raise
                prompt += f"\n\nYour previous response failed validation with this error: {str(e)}. Please carefully fix this specific issue and return the corrected JSON."

strategic_synthesis_engine = StrategicSynthesisEngine()
