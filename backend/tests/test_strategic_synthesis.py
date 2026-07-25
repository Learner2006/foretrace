import pytest
from unittest.mock import AsyncMock, patch
from app.engines.strategic_synthesis import strategic_synthesis_engine
from app.engines.strategic_synthesis import StrategicSynthesisOutput

@pytest.mark.asyncio
async def test_strategic_synthesis_engine_success():
    """Ensures StrategicSynthesisEngine successfully parses a valid LLM response."""
    mock_response = {
        "analogs": [
            {
                "type": "success",
                "company": "Microsoft",
                "analog_ticker": "MSFT",
                "year": 2014,
                "similarity_score": 92,
                "confidence": 88,
                "corpusPercentile": 95,
                "matchCount": 10,
                "what_they_resembled": "Transitioned from license to cloud.",
                "action_taken": "Aggressive R&D into Azure.",
                "outcome": "Massive market cap expansion.",
                "key_difference": "B2B vs B2C focus.",
                "lessons_learned": "Commit fully to the recurring revenue transition.",
                "invalidation_triggers": "Failing to secure enterprise contracts.",
                "citation": "Stratechery, 2015",
                "similarity_basis": ["business_model: shifting to subscription"]
            }
        ],
        "mitigation_levers": [
            {
                "lever": "Double down on recurring revenue",
                "rationale": "Smooths out seasonal volatility",
                "analog_basis": "Microsoft 2014 Cloud Pivot",
                "risk_if_ignored": "Will face extreme revenue cliffs during downturns."
            }
        ]
    }

    with patch("app.engines.strategic_synthesis.groq_client.chat_completion_json", new_callable=AsyncMock) as mock_groq:
        mock_groq.return_value = mock_response
        
        result = await strategic_synthesis_engine.execute(
            company_name="TestCorp",
            extraction_data={"business_model": "transitioning to SaaS"},
            deterministic_outputs={"risk_score": 45}
        )
        
        assert isinstance(result, StrategicSynthesisOutput)
        assert len(result.analogs) == 1
        assert result.analogs[0].company == "Microsoft"
        assert len(result.mitigation_levers) == 1
        assert result.mitigation_levers[0].lever == "Double down on recurring revenue"
