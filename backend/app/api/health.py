"""
Health Check Router

GET /api/health — Returns service health status.
Used by Docker Compose health checks, load balancers, and monitoring tools.
"""

from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from app.config.settings import get_settings

router = APIRouter()
settings = get_settings()


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    timestamp: datetime
    services: dict


@router.get("", response_model=HealthResponse, summary="Health check")
async def health_check() -> HealthResponse:
    """
    Returns the current health status of the API and its dependencies.

    In future phases, this will also check:
    - PostgreSQL connectivity
    - ChromaDB connectivity
    - LLM provider availability
    """
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        timestamp=datetime.now(timezone.utc),
        services={
            "api": "healthy",
            "database": "not_configured",   # Update when DB layer is implemented
            "vector_db": "not_configured",  # Update when memory module is implemented
            "llm": "not_configured",        # Update when orchestrator is implemented
        },
    )
