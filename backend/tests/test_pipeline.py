import pytest
from unittest.mock import patch, AsyncMock
from app.engines.composer import composer_engine
from app.schemas.analysis import AnalysisReport

# Mock SEC filing retrieval text
MOCK_FILING_TEXT = """
Item 1: Business. We are transition to cloud subscription models. Cloud software subscription revenues grew 25 percent. Cloud segments are the primary engine of expansion.
Item 1A: Risk Factors. We face extreme supply chain concentration risk. Single source component assembly is situated in East Asia. Geopolitical issues could disrupt assembly.
Item 7: MD&A. We invested 15 billion dollars in datacenter infrastructure to support compute capacity.
"""

# Mock responses matching each engine's schema to bypass real LLM calls
MOCK_FINANCIAL = {
    "signals": {
        "revenue_trend": "stable",
        "debt_posture": "stable",
        "expansion_signals": ["AI cloud"],
        "margin_pressure": False,
        "layoffs_or_restructuring": False,
        "cash_position": "strong"
    },
    "structural_signals": [
        {
            "observation": "Accelerating Capex to support AI compute",
            "trend": "rising",
            "evidence": "We invested 15 billion dollars in datacenter infrastructure.",
            "why_it_matters": "Higher depreciation costs impact near term margin.",
            "future_implication": "Business relies on high utilization of compute.",
            "possible_invalidation": "If customer demand for AI drops.",
            "confidence": "High",
            "source": "Item 7 (MD&A)"
        }
    ]
}

MOCK_BUSINESS = {
    "behavioral_summary": {
        "observation": "Pivot to cloud subscription models",
        "evidence": "Cloud software subscription revenues grew 25 percent.",
        "why_it_matters": "Hardware margins are dropping, software is expanding.",
        "future_implication": "Long term transition to predictable revenue streams.",
        "confidence": "High",
        "source": "Item 1",
        "key_forces": ["Commoditization", "Subscription pivot"]
    },
    "behavioral_pattern_identified": "Commodity to Subscription Transition",
    "structural_signals": [
        {
            "observation": "Cloud segment growth accelerates",
            "trend": "rising",
            "evidence": "Cloud segments are the primary engine of expansion.",
            "why_it_matters": "Changes standard business model from transaction to contract.",
            "future_implication": "Customer lifetime value becomes the core metric.",
            "possible_invalidation": "Churn rates increase unexpectedly.",
            "confidence": "High",
            "source": "Item 7"
        }
    ]
}

MOCK_RISK = {
    "risk_signals": [
        {
            "observation": "Extreme supply chain concentration risk",
            "evidence": "Single source component assembly is situated in East Asia.",
            "why_it_matters": "Geopolitical disruption could halt all hardware output.",
            "future_implication": "Company might face long product shipping delays.",
            "confidence": "High",
            "source": "Item 1A",
            "probability": "Medium",
            "mitigation": "Investing in domestic manufacturing capabilities."
        }
    ]
}

MOCK_RELATIONSHIP = {
    "relationship_context": {
        "linked_to": ["Nvidia", "AMD"],
        "insight": "Heavily reliant on chip supply from hardware vendors."
    }
}

MOCK_MARKET = {
    "market_position": {
        "moat_strength": "strong",
        "moat_strength_evidence": "Patents and massive scale create barriers.",
        "trajectory": "growing",
        "trajectory_evidence": "Gaining 5% market share in enterprise cloud.",
        "relative_rank": "leader",
        "relative_rank_evidence": "Ranked #1 in cloud satisfaction.",
        "key_dependency": "Hardware supply chains",
        "momentum": "increasing"
    }
}

MOCK_ANALOG = {
    "analogs": [
        {
            "type": "Pivot failure/success",
            "company": "IBM",
            "analog_ticker": "IBM",
            "year": 1993,
            "similarity_score": 85,
            "confidence": 80,
            "corpusPercentile": 90,
            "matchCount": 1,
            "what_they_resembled": "Hardware company trying to pivot to services",
            "action_taken": "Reorganized around services divisions",
            "outcome": "Successful turnaround",
            "key_difference": "Vastly different regulatory conditions",
            "lessons_learned": "Focus on high-value enterprise support",
            "invalidation_triggers": "Commoditization of services",
            "citation": "1993 Annual Report",
            "similarity_basis": ["Hardware legacy", "Pivot model"]
        }
    ]
}

MOCK_RECOMMENDATION = {
    "mitigation_levers": [
        {
            "lever": "Diversify hardware assembly suppliers",
            "rationale": "Mitigates the single source concentration risk.",
            "analog_basis": "Similar to Apple diversifying assembly to India.",
            "risk_if_ignored": "High probability of export blocks.",
            "expected_upside": "Supply chain safety redundancy."
        }
    ]
}


async def mock_chat_completion(prompt, system_message="", *args, **kwargs):
    system_lower = system_message.lower()
    
    if "financial" in system_lower:
        return MOCK_FINANCIAL
    elif "business" in system_lower:
        return MOCK_BUSINESS
    elif "risk" in system_lower:
        return MOCK_RISK
    elif "relationship" in system_lower:
        return MOCK_RELATIONSHIP
    elif "market" in system_lower:
        return MOCK_MARKET
    elif "analog" in system_lower:
        return MOCK_ANALOG
    elif "recommendation" in system_lower:
        return MOCK_RECOMMENDATION
        
    # Fallback to prompt mapping
    prompt_lower = prompt.lower()
    if "financial" in prompt_lower:
        return MOCK_FINANCIAL
    elif "business" in prompt_lower:
        return MOCK_BUSINESS
    elif "risk" in prompt_lower:
        return MOCK_RISK
    elif "relationship" in prompt_lower:
        return MOCK_RELATIONSHIP
    elif "market" in prompt_lower:
        return MOCK_MARKET
    elif "analog" in prompt_lower:
        return MOCK_ANALOG
    elif "recommendation" in prompt_lower:
        return MOCK_RECOMMENDATION
    
    return {}


@pytest.mark.asyncio
@patch("app.services.sec_service.sec_service.fetch_company_filing", new_callable=AsyncMock)
@patch("app.clients.groq_client.groq_client.chat_completion_json", new_callable=AsyncMock)
async def test_composer_pipeline(mock_chat, mock_fetch):
    # Set up mocks
    mock_fetch.return_value = MOCK_FILING_TEXT
    mock_chat.side_effect = mock_chat_completion

    # Run the Composer Engine pipeline
    report_dict = await composer_engine.run_pipeline("Test Corp", "TC")
    
    # Assert return structures
    assert report_dict is not None
    assert report_dict["company"] == "Test Corp"
    assert report_dict["behavioral_pattern_identified"] == "Commodity to Subscription Transition"
    assert len(report_dict["risk_signals"]) == 1
    assert report_dict["signals"]["revenue_trend"] == "stable"
    assert report_dict["market_position"]["moat_strength"] == "strong"
    
    # Check that z-score zones are calculated
    assert "structural_risk" in report_dict
    assert report_dict["structural_risk"]["zone"] == "Safe Zone"
    
    # Validate entire combined report schema structure against Pydantic model
    report_schema = AnalysisReport(**report_dict)
    assert report_schema is not None
