import pytest
from app.schemas.extraction import CorporateKnowledgeGraph
from app.engines.financial import financial_engine
from app.engines.business import business_engine
from app.engines.risk import risk_engine
from app.engines.market import market_engine

# A mock CorporateKnowledgeGraph containing our new analytical fields
MOCK_CKG = CorporateKnowledgeGraph(**{
    "company_name": "Test Corp",
    "ticker": "TEST",
    "business_model": {
        "description": "Subscription SaaS",
        "key_drivers": ["Cloud adoption", "AI integration"],
        "why_it_matters": "Business Model Matters",
        "future_implication": "Business Model Implication",
        "possible_invalidation": "Business Model Invalidation",
        "metrics": {
            "revenue_trend": {
                "value": "stable",
                "confidence": 0.9,
                "evidence": ["Revenue has remained remarkably stable throughout the entire fiscal year."],
                "source_section": "Item 7"
            }
        }
    },
    "capital_allocation": {
        "description": "Heavy R&D",
        "key_drivers": ["Innovation"],
        "why_it_matters": "Capital Allocation Matters",
        "future_implication": "Capital Allocation Implication",
        "possible_invalidation": "Capital Allocation Invalidation",
        "metrics": {
            "debt_posture": {
                "value": "stable",
                "confidence": 0.9,
                "evidence": ["The company's debt posture is stable with no major upcoming maturities."],
                "source_section": "Item 7"
            }
        }
    },
    "competitive_position": {
        "description": "Market leader with strong moat.",
        "key_drivers": ["Patents"],
        "why_it_matters": "Competitive Position Matters",
        "future_implication": "Competitive Position Implication",
        "possible_invalidation": "Competitive Position Invalidation",
        "metrics": {
            "moat": {
                "value": "strong",
                "confidence": 0.9,
                "evidence": ["The economic moat is considered incredibly strong due to proprietary patents."],
                "source_section": "Item 7"
            },
            "trajectory": {
                "value": "growing",
                "confidence": 0.9,
                "evidence": ["The overall competitive trajectory is growing rapidly year over year."],
                "source_section": "Item 7"
            },
            "relative_rank": {
                "value": "leader",
                "confidence": 0.9,
                "evidence": ["The company maintains its position as the undisputed market leader."],
                "source_section": "Item 7"
            }
        }
    },
    "operational_discipline": {
        "description": "Efficiency focused",
        "key_drivers": ["Cost cuts"],
        "why_it_matters": "Operational Discipline Matters",
        "future_implication": "Operational Discipline Implication",
        "possible_invalidation": "Operational Discipline Invalidation",
        "metrics": {
            "margin": {
                "value": "expanding",
                "confidence": 0.9,
                "evidence": ["Operating margins are expanding rapidly due to recent restructuring efforts."],
                "source_section": "Item 7"
            }
        }
    },
    "risk_profile": {
        "description": "Geopolitical risk",
        "key_drivers": ["Supply chain"],
        "why_it_matters": "Risk Profile Matters",
        "future_implication": "Risk Profile Implication",
        "possible_invalidation": "Risk Profile Invalidation",
        "metrics": {
            "concentration": {
                "value": "high",
                "confidence": 0.9,
                "evidence": ["There is a high concentration of supply chain risk in southeast asia."],
                "source_section": "Item 1A"
            }
        }
    },
    "management_priorities": {
        "value": "Focus on AI",
        "confidence": 0.9,
        "evidence": ["We are focusing on AI."],
        "source_section": "Item 7"
    },
    "ecosystem_relationships": [
        {
            "value": "Dependent on TSMC",
            "confidence": 0.9,
            "evidence": ["We rely on TSMC."],
            "source_section": "Item 1"
        }
    ]
})

@pytest.mark.asyncio
async def test_financial_engine_mapping():
    result = await financial_engine.run_deterministic("Test Corp", MOCK_CKG)
    assert len(result.structural_signals) > 0
    signal = result.structural_signals[0]
    assert signal.why_it_matters == "Capital Allocation Matters"
    assert signal.future_implication == "Capital Allocation Implication"
    assert signal.possible_invalidation == "Capital Allocation Invalidation"

@pytest.mark.asyncio
async def test_business_engine_mapping():
    result = await business_engine.run_deterministic("Test Corp", MOCK_CKG)
    assert result.behavioral_summary.why_it_matters == "Business Model Matters"
    assert result.behavioral_summary.future_implication == "Business Model Implication"

@pytest.mark.asyncio
async def test_risk_engine_mapping():
    result = await risk_engine.run_deterministic("Test Corp", MOCK_CKG)
    assert len(result.risk_signals) > 0
    signal = result.risk_signals[0]
    assert signal.why_it_matters == "Risk Profile Matters"
    assert signal.future_implication == "Risk Profile Implication"
    assert signal.mitigation == "Risk Profile Invalidation"

@pytest.mark.asyncio
async def test_market_engine_mapping():
    result = await market_engine.run_deterministic("Test Corp", MOCK_CKG)
    market_pos = result.market_position
    assert market_pos.moat_strength == "strong"
    assert market_pos.trajectory == "growing"
    assert market_pos.relative_rank == "leader"
