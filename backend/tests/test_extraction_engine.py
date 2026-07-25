import pytest
from unittest.mock import AsyncMock, patch
from app.engines.extraction import extraction_engine
from app.schemas.extraction import CorporateKnowledgeGraph

@pytest.mark.asyncio
async def test_extraction_engine_success():
    """Ensures ExtractionEngine successfully parses a valid LLM response into the Knowledge Graph."""
    mock_response = {
        "company_name": "TestCorp",
        "ticker": "TEST",
        "schema_version": "v1.0",
        "business_model": {
            "description": "SaaS",
            "key_drivers": ["Cloud adoption"],
            "why_it_matters": "why",
            "future_implication": "future",
            "possible_invalidation": "invalid",
            "metrics": {
                "growth": {
                    "value": "High",
                    "confidence": 0.9,
                    "evidence": ["Grew 40%"],
                    "source_section": "Item 7"
                }
            }
        },
        "capital_allocation": {
            "description": "Buybacks",
            "key_drivers": ["Excess cash"],
            "why_it_matters": "why",
            "future_implication": "future",
            "possible_invalidation": "invalid",
            "metrics": {
                "cash": {
                    "value": "Strong",
                    "confidence": 0.8,
                    "evidence": ["$10B in cash"],
                    "source_section": "Item 1"
                }
            }
        },
        "competitive_position": {
            "description": "Leader",
            "key_drivers": ["Moat"],
            "why_it_matters": "why",
            "future_implication": "future",
            "possible_invalidation": "invalid",
            "metrics": {
                "moat": {
                    "value": "Wide",
                    "confidence": 0.9,
                    "evidence": ["Dominant market share"],
                    "source_section": "Item 7"
                }
            }
        },
        "operational_discipline": {
            "description": "Efficient",
            "key_drivers": ["Automation"],
            "why_it_matters": "why",
            "future_implication": "future",
            "possible_invalidation": "invalid",
            "metrics": {
                "margin": {
                    "value": "Expanding",
                    "confidence": 0.85,
                    "evidence": ["Margins expanded 200bps"],
                    "source_section": "Item 7"
                }
            }
        },
        "risk_profile": {
            "description": "Low risk",
            "key_drivers": ["Diversified"],
            "why_it_matters": "why",
            "future_implication": "future",
            "possible_invalidation": "invalid",
            "metrics": {
                "geo_risk": {
                    "value": "Low",
                    "confidence": 0.7,
                    "evidence": ["Operations in 100 countries"],
                    "source_section": "Item 1A"
                }
            }
        },
        "management_priorities": {
            "value": "AI investment",
            "confidence": 0.95,
            "evidence": ["We are investing heavily in AI"],
            "source_section": "Item 7"
        },
        "ecosystem_relationships": [
            {
                "value": "AWS dependency",
                "confidence": 0.8,
                "evidence": ["Hosted on AWS"],
                "source_section": "Item 1"
            }
        ]
    }

    with patch("app.engines.extraction.groq_client.chat_completion_json", new_callable=AsyncMock) as mock_groq:
        mock_groq.return_value = mock_response
        
        result = await extraction_engine.execute("TestCorp", "Fake SEC Filing", "TEST")
        
        assert isinstance(result, CorporateKnowledgeGraph)
        assert result.company_name == "TestCorp"
        assert result.business_model.description == "SaaS"
        assert result.ecosystem_relationships[0].value == "AWS dependency"
