"""
Test: Health Endpoint

Tests that the /api/health endpoint responds correctly.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_check_returns_200():
    """Health endpoint should return 200 with healthy status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "environment" in data
    assert "services" in data


@pytest.mark.asyncio
async def test_health_check_contains_api_service():
    """Health endpoint should include an 'api' entry in services."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")

    data = response.json()
    assert data["services"]["api"] == "healthy"
