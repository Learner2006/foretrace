from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class EvidenceObject(BaseModel):
    """Wraps every subjective extraction in a mandatory chain of evidence."""
    value: Any = Field(..., description="The actual extracted value or category")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model's confidence in this extraction")
    evidence: List[str] = Field(..., description="Direct, exact quotes from the SEC filing supporting this value")
    source_section: str = Field(..., description="Which specific part of the filing this came from (e.g. Item 7 MD&A)")
    
class StructuralPillar(BaseModel):
    """A thematic evaluation of a company's structural evolution."""
    description: str = Field(..., description="A narrative description of this structural pillar")
    key_drivers: List[str] = Field(..., description="The main forces driving this pillar")
    metrics: Dict[str, EvidenceObject] = Field(..., description="Quantitative or qualitative metrics tied to this pillar wrapped in evidence")
    why_it_matters: str = Field(..., description="Specific business impact and strategic tension of this pillar")
    future_implication: str = Field(..., description="Long-term effect on the business model")
    possible_invalidation: str = Field(..., description="What specific data point/event would prove this signal wrong")

class CorporateKnowledgeGraph(BaseModel):
    """
    Unified L1 Extraction Schema.
    This graph models a company by its structural pillars, ensuring explainable L2 synthesis.
    """
    company_name: str
    ticker: str
    schema_version: str = Field(default="v1.0", description="Used for cache invalidation")
    
    # 1. Structural Pillars
    business_model: StructuralPillar = Field(..., description="How the company makes money and how that is evolving")
    capital_allocation: StructuralPillar = Field(..., description="How the company spends cash (Buybacks, R&D, M&A)")
    competitive_position: StructuralPillar = Field(..., description="Moat strength, trajectory, and market dominance")
    operational_discipline: StructuralPillar = Field(..., description="Margin focus, layoffs, restructuring, efficiency gains")
    risk_profile: StructuralPillar = Field(..., description="Geopolitical, supplier, customer concentration, and macro risks")
    
    # 2. Key Catalysts / Strategic Direction
    management_priorities: EvidenceObject = Field(..., description="The stated primary objectives for the next 12-24 months")
    
    # 3. Ecosystem
    ecosystem_relationships: List[EvidenceObject] = Field(..., description="Key dependencies on other platforms, suppliers, or partners")
