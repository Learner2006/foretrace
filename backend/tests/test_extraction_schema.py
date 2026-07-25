import pytest
from pydantic import ValidationError
from app.schemas.extraction import CorporateKnowledgeGraph, EvidenceObject, StructuralPillar

def test_evidence_object_valid():
    """Ensures a properly formed EvidenceObject passes validation."""
    evidence = EvidenceObject(
        value="Dominant",
        confidence=0.95,
        evidence=["The company controls 80% of the market"],
        source_section="10-K Item 1"
    )
    assert evidence.value == "Dominant"
    assert evidence.confidence == 0.95

def test_evidence_object_invalid_confidence():
    """Ensures confidence bounds are strictly enforced (0.0 to 1.0)."""
    with pytest.raises(ValidationError):
        EvidenceObject(
            value="Dominant",
            confidence=1.5,  # Invalid
            evidence=["Controls market"],
            source_section="Item 1"
        )

def test_structural_pillar_valid():
    """Ensures a StructuralPillar requires metrics wrapped in EvidenceObjects."""
    pillar = StructuralPillar(
        description="Transitioning to SaaS",
        key_drivers=["Subscription Growth"],
        why_it_matters="SaaS why",
        future_implication="SaaS future",
        possible_invalidation="SaaS invalidation",
        metrics={
            "subscription_revenue": EvidenceObject(
                value="Growing rapidly",
                confidence=0.88,
                evidence=["Subscription revenue grew 40% YoY"],
                source_section="Item 7"
            )
        }
    )
    assert "subscription_revenue" in pillar.metrics
    assert pillar.metrics["subscription_revenue"].confidence == 0.88

def test_corporate_knowledge_graph_valid():
    """Ensures the full graph builds properly when all pillars are present."""
    pillar_mock = StructuralPillar(
        description="Test Pillar",
        key_drivers=["Driver 1"],
        why_it_matters="Test why",
        future_implication="Test future",
        possible_invalidation="Test invalidation",
        metrics={"test_metric": EvidenceObject(
            value="Test",
            confidence=0.9,
            evidence=["Quote"],
            source_section="Item 7"
        )}
    )
    
    evidence_mock = EvidenceObject(
        value="Focus on AI",
        confidence=0.99,
        evidence=["We are focusing on AI"],
        source_section="Item 1"
    )

    graph = CorporateKnowledgeGraph(
        company_name="TestCorp",
        ticker="TEST",
        business_model=pillar_mock,
        capital_allocation=pillar_mock,
        competitive_position=pillar_mock,
        operational_discipline=pillar_mock,
        risk_profile=pillar_mock,
        management_priorities=evidence_mock,
        ecosystem_relationships=[evidence_mock]
    )
    
    assert graph.company_name == "TestCorp"
    assert graph.schema_version == "v1.0"
