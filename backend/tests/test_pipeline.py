import pytest
from unittest.mock import patch, AsyncMock
from app.engines.composer import composer_engine
from app.schemas.analysis import AnalysisReport

MOCK_FILING_TEXT = "Item 1: Business..."

MOCK_EXTRACTION = {
    "company_name": "Test Corp",
    "ticker": "TC",
    "schema_version": "v1.0",
    "business_model": {
        "description": "Subscription SaaS",
        "key_drivers": ["Cloud adoption", "AI integration"],
        "why_it_matters": "Changes standard business model from transaction to contract.",
        "future_implication": "Long term transition to predictable revenue streams.",
        "possible_invalidation": "Churn rates increase unexpectedly.",
        "metrics": {
            "revenue_trend": {
                "value": "stable",
                "confidence": 0.9,
                "evidence": ["Revenues grew steadily"],
                "source_section": "Item 7"
            }
        }
    },
    "capital_allocation": {
        "description": "Heavy R&D",
        "key_drivers": ["Innovation"],
        "why_it_matters": "Higher depreciation costs impact near term margin.",
        "future_implication": "Business relies on high utilization of compute.",
        "possible_invalidation": "If customer demand for AI drops.",
        "metrics": {
            "debt_posture": {
                "value": "stable",
                "confidence": 0.9,
                "evidence": ["Debt remains flat"],
                "source_section": "Item 7"
            },
            "cash_position": {
                "value": "strong",
                "confidence": 0.8,
                "evidence": ["$10B cash on hand"],
                "source_section": "Item 7"
            },
            "capex_trend": {
                "value": "rising",
                "confidence": 0.9,
                "evidence": ["CapEx increased"],
                "source_section": "Item 7"
            }
        }
    },
    "competitive_position": {
        "description": "Market leader with strong moat.",
        "key_drivers": ["Patents"],
        "why_it_matters": "Patents create a structural barrier to entry.",
        "future_implication": "Pricing power remains robust.",
        "possible_invalidation": "Competitor develops alternative tech.",
        "metrics": {
            "moat": {
                "value": "strong",
                "confidence": 0.9,
                "evidence": ["Patents provide moat"],
                "source_section": "Item 1"
            }
        }
    },
    "operational_discipline": {
        "description": "Efficiency focused",
        "key_drivers": ["Cost cuts"],
        "why_it_matters": "Improves free cash flow conversion.",
        "future_implication": "Potential underinvestment in future products.",
        "possible_invalidation": "Operational incidents rise due to cuts.",
        "metrics": {
            "margin": {
                "value": "expanding",
                "confidence": 0.9,
                "evidence": ["Margins expanded"],
                "source_section": "Item 7"
            }
        }
    },
    "risk_profile": {
        "description": "Geopolitical risk",
        "key_drivers": ["Supply chain"],
        "why_it_matters": "Disruption could halt all hardware output.",
        "future_implication": "Company might face long product shipping delays.",
        "possible_invalidation": "Successfully diversifies supply chain.",
        "metrics": {
            "concentration": {
                "value": "high",
                "confidence": 0.9,
                "evidence": ["Single source assembly"],
                "source_section": "Item 1A"
            }
        }
    },
    "management_priorities": {
        "value": "Transition to subscription",
        "confidence": 0.9,
        "evidence": ["Focusing on subscription"],
        "source_section": "Item 1"
    },
    "ecosystem_relationships": [
        {
            "value": "Nvidia",
            "confidence": 0.9,
            "evidence": ["Rely on Nvidia"],
            "source_section": "Item 1"
        }
    ]
}

MOCK_SYNTHESIS = {
    "analogs": [
        {
            "type": "success",
            "company": "Microsoft",
            "analog_ticker": "MSFT",
            "year": 2014,
            "similarity_score": 90,
            "confidence": 85,
            "corpusPercentile": 95,
            "matchCount": 5,
            "what_they_resembled": "Cloud transition",
            "action_taken": "Invested in Azure",
            "outcome": "Success",
            "key_difference": "B2B",
            "lessons_learned": "Commit to cloud",
            "invalidation_triggers": "None",
            "citation": "Stratechery",
            "similarity_basis": ["business_model"]
        }
    ],
    "mitigation_levers": [
        {
            "lever": "Invest in recurring revenue",
            "rationale": "Stable",
            "analog_basis": "MSFT",
            "risk_if_ignored": "Volatility"
        }
    ]
}

async def mock_chat_completion(prompt, system_message, tier, model=None):
    if "Extractor" in system_message:
        return MOCK_EXTRACTION
    elif "Synthesis" in system_message:
        return MOCK_SYNTHESIS
    return {}

@pytest.mark.asyncio
@patch("app.services.sec_service.sec_service.fetch_company_filing", new_callable=AsyncMock)
@patch("app.clients.groq_client.groq_client.chat_completion_json", new_callable=AsyncMock)
async def test_composer_pipeline(mock_chat, mock_fetch):
    mock_fetch.return_value = MOCK_FILING_TEXT
    mock_chat.side_effect = mock_chat_completion

    report_dict = await composer_engine.run_pipeline("Test Corp", "TC")
    
    assert report_dict is not None
    assert report_dict["company"] == "Test Corp"
    assert report_dict["behavioral_pattern_identified"] == "Transitioning structural profile"
    assert len(report_dict["risk_signals"]) > 0
    assert report_dict["signals"]["revenue_trend"] == "stable"
    assert report_dict["market_position"]["moat_strength"] == "strong"
    assert "structural_risk" in report_dict
    
    # Validate final schema
    report_schema = AnalysisReport(**report_dict)
    assert report_schema is not None
