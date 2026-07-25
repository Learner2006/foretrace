from app.clients.groq_client import groq_client
from app.schemas.analysis import RelationshipContext
from pydantic import BaseModel
import json
import re
from app.schemas.extraction import CorporateKnowledgeGraph

class RelationshipEngineOutput(BaseModel):
    relationship_context: RelationshipContext

class RelationshipEngine:
    async def run_deterministic(self, company_name: str, extraction_data: CorporateKnowledgeGraph) -> RelationshipEngineOutput:
        """
        Pure Python mapping of Structural Pillars to legacy Relationship Context.
        """
        linked_to = []
        insight = "Mapped ecosystem relationships based on extraction."
        
        if extraction_data.ecosystem_relationships:
            linked_to = [rel.value for rel in extraction_data.ecosystem_relationships]
            rel_zero = extraction_data.ecosystem_relationships[0]
            insight = rel_zero.evidence[0] if rel_zero.evidence else "No specific evidence provided."
            
        return RelationshipEngineOutput(
            relationship_context=RelationshipContext(
                linked_to=linked_to,
                insight=insight
            )
        )

relationship_engine = RelationshipEngine()
