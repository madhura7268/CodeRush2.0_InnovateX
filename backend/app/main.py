"""
Self-Evolving Autonomous Research Agent — FastAPI Application Entry Point

This module bootstraps the FastAPI application, registers all routers,
configures middleware, and sets up startup/shutdown lifecycle hooks.

Architecture:
    - Clean Architecture: API layer → Service layer → Domain layer
    - All modules are injected via FastAPI's Depends() system
    - Each module implements a defined interface (see app/interfaces/)
    - Real business logic lives in individual module folders (research/, planner/, etc.)

Adding a new module:
    1. Define the interface in app/interfaces/<module>.py
    2. Implement the logic in app/<module>/<module>.py
    3. Register the dependency in app/core/dependencies.py
    4. Create the router in app/api/<module>.py
    5. Include the router here in create_application()
"""

import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config.settings import get_settings
from app.core.exceptions import (
    AgentException,
    GovernanceViolationException,
    agent_exception_handler,
    governance_violation_handler,
    unhandled_exception_handler,
)
from app.core.logging import configure_logging, get_logger

# ---------------------------------------------------------------------------
# Bootstrap logging immediately (before any other imports that might log)
# ---------------------------------------------------------------------------
configure_logging()
logger = get_logger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Application Lifespan (startup / shutdown hooks)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Manage application lifecycle events.

    Startup:
        - Validate configuration
        - Initialize database connection pools (when DB layer is implemented)
        - Initialize ChromaDB client (when memory module is implemented)
        - Warm up LLM clients (when orchestrator is implemented)

    Shutdown:
        - Close database connections
        - Flush logs and metrics
        - Cancel running research tasks
    """
    # ---- STARTUP ----
    logger.info(
        "Starting Self-Evolving Research Agent",
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
    )

    # TODO: Initialize database connection pool
    # from app.core.database import init_db
    # await init_db()

    # TODO: Initialize ChromaDB client
    # from app.memory.client import init_chroma
    # await init_chroma()

    # TODO: Initialize LLM provider
    # from app.orchestrator.client import init_llm
    # await init_llm()

    logger.info("All services initialized. Application is ready.", allowed_origins=settings.ALLOWED_ORIGINS)

    yield

    # ---- SHUTDOWN ----
    logger.info("Shutting down application...")

    # TODO: Close database connections
    # await close_db()

    logger.info("Application shutdown complete.")


# ---------------------------------------------------------------------------
# Application Factory
# ---------------------------------------------------------------------------
def create_application() -> FastAPI:
    """
    Factory function that creates and configures the FastAPI application.

    Using a factory pattern allows easy testing via dependency overrides.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Self-Evolving Autonomous Research Agent API — "
            "An agentic system that plans, researches, experiments, "
            "evaluates, and self-improves under governance policies."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # --- CORS Middleware ---
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Request timing middleware ---
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        """Attach X-Process-Time header to every response for performance monitoring."""
        start_time = time.time()
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        return response

    # --- Request logging middleware ---
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """Log every incoming request and its response status."""
        logger.info(
            "Incoming request",
            method=request.method,
            path=request.url.path,
            client=request.client.host if request.client else "unknown",
        )
        response = await call_next(request)
        logger.info(
            "Request completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
        )
        return response

    # --- Exception Handlers ---
    app.add_exception_handler(GovernanceViolationException, governance_violation_handler)
    app.add_exception_handler(AgentException, agent_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # --- API Routers ---
    app.include_router(api_router, prefix="/api")

    return app


# ---------------------------------------------------------------------------
# Application instance
# ---------------------------------------------------------------------------
app = create_application()
