import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.analysis import AnalyzeRequest, CompareRequest, sanitize_string
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
    # Valid ticker format
    req = AnalyzeRequest(company_name="Tesla", ticker="TSLA")
    assert req.ticker == "TSLA"
    
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

    # Protected routes accept token query param
    response = client.post(
        "/analyze?token=demo_token",
        json={"company_name": "Test Company", "ticker": "TEST"}
    )
    assert response.status_code != 401


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
