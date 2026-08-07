"""
Test: Research API Endpoints

Tests that research session endpoints respond correctly
using the pipeline implementation.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_start_research_returns_session_id():
    """Starting research should return a session_id and websocket URL."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/research",
            json={"question": "What are the latest advances in quantum computing?"},
        )

    assert response.status_code == 202
    data = response.json()
    assert data["success"] is True
    assert "session_id" in data
    assert "websocket_url" in data


@pytest.mark.asyncio
async def test_get_session_status_returns_status():
    """Getting status for an existing session should return session data."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Start a session first
        create_response = await client.post(
            "/api/research",
            json={"question": "What are the latest advances in quantum computing?"},
        )
        session_id = create_response.json()["session_id"]

        # Now get its status
        status_response = await client.get(f"/api/research/{session_id}")

    assert status_response.status_code == 200
    data = status_response.json()
    assert data["session_id"] == session_id
    assert "status" in data


@pytest.mark.asyncio
async def test_get_nonexistent_session_returns_404():
    """Getting status for a non-existent session should return 404."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/research/nonexistent-session-id")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_research_question_validation():
    """Research question must be at least 10 characters long."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/research",
            json={"question": "short"},
        )

    assert response.status_code == 422  # Validation error
