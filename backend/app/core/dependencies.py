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

from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from app.browser.browser_tool import BrowserTool
from app.config.settings import Settings, get_settings
from app.evaluation.evaluation import EvaluationService
from app.governance.governance import GovernanceEngine
from app.interfaces.browser import IBrowserTool
from app.interfaces.evaluation import IEvaluation
from app.interfaces.governance import IGovernanceEngine
from app.interfaces.memory import IMemory
from app.interfaces.orchestrator import IAgentOrchestrator
from app.interfaces.planner import IPlanner
from app.interfaces.research import IResearchPipeline
from app.memory.memory import MemoryService
from app.orchestrator.orchestrator import AgentOrchestrator
from app.planner.planner import ResearchPlanner
from app.research.pipeline import ResearchPipeline
from app.research.services.research_pipeline_service import ResearchPipelineService
from app.websocket.manager import WebSocketManager

# ---------------------------------------------------------------------------
# Settings dependency (shared singleton)
# ---------------------------------------------------------------------------
SettingsDep = Annotated[Settings, Depends(get_settings)]


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
) -> IResearchPipeline:
    """Provides the ResearchPipeline implementation."""
    return ResearchPipeline(settings=settings)


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
