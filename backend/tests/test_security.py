import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.analysis import AnalyzeRequest, sanitize_string
from app.utils.circuit_breaker import CircuitBreaker, CircuitBreakerOpenException
import asyncio

client = TestClient(app)

# ── 1. Input Sanitization and Validation Tests ───────────────────────────────

def test_input_sanitization():
    # Normal input is untouched
    assert sanitize_string("Apple Inc.") == "Apple Inc."
    # Strip HTML tags and escape HTML special characters
    assert sanitize_string("Google <script>alert('bad')</script>") == "Google alert(&#x27;bad&#x27;)"
    # Escape HTML special characters
    assert sanitize_string("A & B") == "A &amp; B"
    
    # Reject null bytes
    with pytest.raises(ValueError, match="Input contains null bytes"):
        sanitize_string("Bad\x00Name")
        
    # Reject control characters
    with pytest.raises(ValueError, match="Input contains null bytes"):
        sanitize_string("Bad\x07Name")


def test_ticker_validation():
    # Valid ticker formats
    req1 = AnalyzeRequest(company_name="Tesla", ticker="TSLA")
    assert req1.ticker == "TSLA"
    
    req2 = AnalyzeRequest(company_name="Spotify", ticker="SPOT")
    assert req2.ticker == "SPOT"
    
    # Indian tickers throw validation error because they are not supported
    with pytest.raises(ValueError, match="Indian companies are not supported"):
        AnalyzeRequest(company_name="Reliance", ticker="RELIANCE.NS")
        
    with pytest.raises(ValueError, match="Indian companies are not supported"):
        AnalyzeRequest(company_name="BSE stock", ticker="500180.BO")
    
    # Invalid ticker lengths/chars throw validation error
    with pytest.raises(ValueError):
        AnalyzeRequest(company_name="Tesla", ticker="INVALIDTICKER")

    with pytest.raises(ValueError):
        AnalyzeRequest(company_name="Tesla", ticker="123")


# ── 2. Authentication Middleware Tests ────────────────────────────────────────

def test_authentication_middleware():
    # Health checks bypass auth
    response = client.get("/health")
    assert response.status_code == 200
    
    # Protected routes fail with 401 without auth credentials
    response = client.post("/analyze", json={"company_name": "Test Company", "ticker": "TEST"})
    assert response.status_code == 401
    
    # Protected routes accept X-API-Key header
    response = client.post(
        "/analyze",
        json={"company_name": "Test Company", "ticker": "TEST"},
        headers={"X-API-Key": "demo_token"}
    )
    # Status code is not 401 (could be 404 or 200 depending on actual file fetching)
    assert response.status_code != 401

    # Protected REST routes reject token query param (to prevent leakage in URL logs)
    response = client.post(
        "/analyze?token=demo_token",
        json={"company_name": "Test Company", "ticker": "TEST"}
    )
    assert response.status_code == 401


# ── 3. Request Size Limiting Tests ───────────────────────────────────────────

def test_request_body_size_limit():
    # Massive requests (>10KB) are blocked before processing
    large_payload = {"company_name": "A" * 15000, "ticker": "TEST"}
    response = client.post(
        "/analyze",
        json=large_payload,
        headers={"X-API-Key": "demo_token"}
    )
    assert response.status_code == 413
    assert "Request body too large" in response.json()["detail"]


# ── 4. Circuit Breaker State Transition Tests ────────────────────────────────

@pytest.mark.asyncio
async def test_circuit_breaker():
    cb = CircuitBreaker("Test Circuit", failure_threshold=2, recovery_time=0.3, success_threshold=1)
    
    # Initial state is CLOSED
    assert cb.state.name == "CLOSED"
    
    async def failing_func():
        raise Exception("API Error")
        
    wrapped = cb(failing_func)
    
    # First failure
    with pytest.raises(Exception):
        await wrapped()
    assert cb.state.name == "CLOSED"
    
    # Second failure triggers state change to OPEN
    with pytest.raises(Exception):
        await wrapped()
    assert cb.state.name == "OPEN"
    
    # Further requests are blocked immediately
    with pytest.raises(CircuitBreakerOpenException):
        await wrapped()
        
    # Wait for recovery period
    await asyncio.sleep(0.4)
    
    # Transition to HALF_OPEN to verify recovery
    with pytest.raises(Exception):
        await wrapped()
    # Fails again, moves back to OPEN
    assert cb.state.name == "OPEN"


# ── 5. WebSocket Comparison Validation Tests ──────────────────────────────────


def test_websocket_analyze_validation():
    # Mock analyze_company service method to avoid hitting actual engines
    with patch("app.api.routes.analysis.analysis_service.analyze_company", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.return_value = {"status": "success"}
        
        # Connect using the websocket client
        with client.websocket_connect("/ws/analyze/NVDA?token=demo_token") as websocket:
            # Send payload
            websocket.send_json({
                "company_name": "NVIDIA Corporation"
            })
            
            # The websocket should validate the request, run the analysis and send the result
            response = websocket.receive_json()
            assert response == {"type": "result", "data": {"status": "success"}}
            
            mock_analyze.assert_called_once()
            args, kwargs = mock_analyze.call_args
            assert args[0] == "NVIDIA Corporation"
            assert args[1] == "NVDA"


def test_admin_endpoints_authorization():
    # Calling cache stats without admin credentials should return 403 Forbidden
    response = client.get("/cache/stats", headers={"X-API-Key": "demo_token"})
    assert response.status_code == 403
    assert response.json()["detail"] == "Forbidden. Admin privileges required."

    # Calling cache stats with admin credentials should succeed
    response = client.get("/cache/stats", headers={"X-API-Key": "demo_token", "X-Admin-Key": "demo_admin_token"})
    assert response.status_code == 200

    # Calling cache stats with admin query token should succeed
    response = client.get("/cache/stats?admin_token=demo_admin_token", headers={"X-API-Key": "demo_token"})
    assert response.status_code == 200

    # Invalidation without admin credentials should return 403
    response = client.delete("/cache/AAPL", headers={"X-API-Key": "demo_token"})
    assert response.status_code == 403

    # Invalidation with admin credentials should succeed
    response = client.delete("/cache/AAPL", headers={"X-API-Key": "demo_token", "X-Admin-Key": "demo_admin_token"})
    assert response.status_code == 200
    assert response.json() == {"invalidated": "AAPL"}


