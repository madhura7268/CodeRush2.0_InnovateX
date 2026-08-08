"""
Dependency Injection Container

Provides FastAPI Depends() factory functions for all module interfaces.
This is the central wiring point of the application.

How it works:
    1. Each module has an interface (abstract class) in app/interfaces/
    2. Each module has a concrete implementation in app/<module>/
    3. This file maps interfaces → implementations via FastAPI's Depends()
    4. Routers import only the interface type and use Depends(get_<module>)
    5. To swap an implementation, change only this file

How to add a new module:
    1. Create the interface in app/interfaces/<module>.py
    2. Implement it in app/<module>/<module>.py
    3. Add a get_<module>() function here
    4. Use Annotated[IModule, Depends(get_module)] in your router
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.browser.browser_tool import BrowserTool
from app.config.settings import Settings, get_settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.evaluation.evaluation import EvaluationService
from app.governance.governance import GovernanceEngine
from app.interfaces.browser import IBrowserTool
from app.interfaces.evaluation import IEvaluation
from app.interfaces.governance import IGovernanceEngine
from app.interfaces.memory import IMemory
from app.interfaces.orchestrator import IAgentOrchestrator
from app.interfaces.planner import IPlanner
from app.interfaces.research import IResearchPipeline
from app.interfaces.report import IReportGenerator
from app.memory.memory import MemoryService
from app.orchestrator.orchestrator import AgentOrchestrator
from app.planner.planner import ResearchPlanner
from app.research.pipeline import ResearchPipeline
from app.research.report_generator import ReportGenerator
from app.research.services.research_pipeline_service import ResearchPipelineService
from app.websocket.manager import WebSocketManager

# ---------------------------------------------------------------------------
# Settings & Database Dependencies
# ---------------------------------------------------------------------------
SettingsDep = Annotated[Settings, Depends(get_settings)]
DatabaseDep = Annotated[AsyncSession, Depends(get_db)]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(
    db: DatabaseDep,
    token: str | None = Depends(oauth2_scheme),
    authorization: str | None = Header(default=None),
) -> User:
    """Validate JWT token and return the authenticated User entity from database."""
    actual_token = token
    if not actual_token and authorization and authorization.startswith("Bearer "):
        actual_token = authorization.split(" ")[1]

    if not actual_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(actual_token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_optional_current_user(
    db: DatabaseDep,
    token: str | None = Depends(oauth2_scheme),
    authorization: str | None = Header(default=None),
) -> User | None:
    """Return authenticated User if token is present, else None."""
    try:
        return await get_current_user(db, token, authorization)
    except HTTPException:
        return None


CurrentUserDep = Annotated[User, Depends(get_current_user)]
OptionalCurrentUserDep = Annotated[User | None, Depends(get_optional_current_user)]


# ---------------------------------------------------------------------------
# WebSocket Manager (singleton, not interface-backed)
# ---------------------------------------------------------------------------
@lru_cache(maxsize=1)
def get_websocket_manager() -> WebSocketManager:
    """Returns a singleton WebSocket connection manager."""
    return WebSocketManager()


WebSocketManagerDep = Annotated[WebSocketManager, Depends(get_websocket_manager)]


# ---------------------------------------------------------------------------
# Module: Research Pipeline
# Interface: IResearchPipeline
# Implementation: ResearchPipeline
# ---------------------------------------------------------------------------
def get_research_pipeline(
    settings: SettingsDep,
    planner: PlannerDep,
    orchestrator: OrchestratorDep,
    evaluation: EvaluationDep,
    governance: GovernanceEngineDep,
    memory: MemoryDep,
    report_generator: "ReportGeneratorDep",
    ws_manager: WebSocketManagerDep,
) -> IResearchPipeline:
    """Provides the ResearchPipeline implementation."""
    return ResearchPipeline(
        settings=settings,
        planner=planner,
        orchestrator=orchestrator,
        evaluation=evaluation,
        governance=governance,
        memory=memory,
        report_generator=report_generator,
        ws_manager=ws_manager,
    )


ResearchPipelineDep = Annotated[IResearchPipeline, Depends(get_research_pipeline)]


@lru_cache(maxsize=1)
def get_research_pipeline_service() -> ResearchPipelineService:
    """Provides the singleton instance of the ResearchPipelineService."""
    return ResearchPipelineService(settings=get_settings())


ResearchPipelineServiceDep = Annotated[
    ResearchPipelineService, Depends(get_research_pipeline_service)
]


# ---------------------------------------------------------------------------
# Module: Planner
# Interface: IPlanner
# Implementation: ResearchPlanner
# ---------------------------------------------------------------------------
def get_planner(settings: SettingsDep) -> IPlanner:
    """Provides the ResearchPlanner implementation."""
    return ResearchPlanner(settings=settings)


PlannerDep = Annotated[IPlanner, Depends(get_planner)]


# ---------------------------------------------------------------------------
# Module: Agent Orchestrator
# Interface: IAgentOrchestrator
# Implementation: AgentOrchestrator
# ---------------------------------------------------------------------------
def get_orchestrator(settings: SettingsDep) -> IAgentOrchestrator:
    """Provides the AgentOrchestrator implementation (LangGraph state machine)."""
    return AgentOrchestrator(settings=settings)


OrchestratorDep = Annotated[IAgentOrchestrator, Depends(get_orchestrator)]


# ---------------------------------------------------------------------------
# Module: Browser Tool
# Interface: IBrowserTool
# Implementation: BrowserTool
# ---------------------------------------------------------------------------
def get_browser_tool(settings: SettingsDep) -> IBrowserTool:
    """Provides the BrowserTool implementation (Tavily search)."""
    return BrowserTool(settings=settings)


BrowserToolDep = Annotated[IBrowserTool, Depends(get_browser_tool)]


# ---------------------------------------------------------------------------
# Module: Governance Engine
# Interface: IGovernanceEngine
# Implementation: GovernanceEngine
# ---------------------------------------------------------------------------
def get_governance_engine(settings: SettingsDep) -> IGovernanceEngine:
    """Provides the GovernanceEngine implementation (safety policy checks)."""
    return GovernanceEngine(settings=settings)


GovernanceEngineDep = Annotated[IGovernanceEngine, Depends(get_governance_engine)]


# ---------------------------------------------------------------------------
# Module: Memory / RAG
# Interface: IMemory
# Implementation: MemoryService
# ---------------------------------------------------------------------------
def get_memory(settings: SettingsDep) -> IMemory:
    """Provides the MemoryService implementation (ChromaDB + embeddings)."""
    return MemoryService(settings=settings)


MemoryDep = Annotated[IMemory, Depends(get_memory)]


# ---------------------------------------------------------------------------
# Module: Evaluation
# Interface: IEvaluation
# Implementation: EvaluationService
# ---------------------------------------------------------------------------
def get_evaluation(settings: SettingsDep) -> IEvaluation:
    """Provides the EvaluationService implementation."""
    return EvaluationService(settings=settings)


EvaluationDep = Annotated[IEvaluation, Depends(get_evaluation)]


# ---------------------------------------------------------------------------
# Module: Report Generator
# Interface: IReportGenerator
# Implementation: ReportGenerator
# ---------------------------------------------------------------------------
def get_report_generator(memory: MemoryDep) -> IReportGenerator:
    """Provides the ReportGenerator implementation."""
    return ReportGenerator(memory=memory)


ReportGeneratorDep = Annotated[IReportGenerator, Depends(get_report_generator)]
