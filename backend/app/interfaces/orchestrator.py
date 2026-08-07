"""
Interface: IAgentOrchestrator

Defines the contract for the Agent Orchestrator module.

The Orchestrator is the execution engine of the research agent.
It receives a ResearchPlan and executes each TaskStep by:
    1. Consulting the Governance Engine for permission
    2. Routing to the appropriate tool (BrowserTool, Sandbox, Memory)
    3. Collecting tool outputs
    4. Updating session state
    5. Emitting progress events to the WebSocket manager

Implementation suggestion: Use LangGraph's StateGraph to model
the research process as a directed graph with conditional edges.

Implementing this module:
    - File: backend/app/orchestrator/orchestrator.py
    - Register in backend/app/core/dependencies.py
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import Any

from app.schemas.planner import ResearchPlan, TaskStep


class IAgentOrchestrator(ABC):
    """Abstract interface for the LangGraph-based agent orchestrator."""

    @abstractmethod
    async def execute_plan(
        self, plan: ResearchPlan, session_id: str
    ) -> AsyncGenerator[dict[str, Any], None]:
        """
        Execute a research plan step by step.

        For each step:
        1. Emit a 'step_started' event
        2. Check with Governance Engine
        3. Execute via appropriate tool
        4. Store result in Memory
        5. Emit a 'step_completed' or 'step_failed' event

        Args:
            plan: The validated research plan to execute.
            session_id: The active research session ID.

        Yields:
            Dict: Step execution events with type, step_id, result, and metadata.
        """
        ...

    @abstractmethod
    async def execute_step(
        self, step: TaskStep, session_id: str
    ) -> dict[str, Any]:
        """
        Execute a single task step.

        Args:
            step: The task step to execute.
            session_id: The active research session ID.

        Returns:
            A dict containing step output, tool used, duration, and status.
        """
        ...

    @abstractmethod
    async def get_agent_state(self, session_id: str) -> dict[str, Any]:
        """
        Retrieve the current state of the agent for a session.

        Returns the LangGraph state object, which includes:
        - Current step being executed
        - Tool call history
        - Intermediate results
        - Iteration count

        Args:
            session_id: The session to query.
        """
        ...

    @abstractmethod
    async def pause_execution(self, session_id: str) -> bool:
        """Pause execution of a running plan (human-in-the-loop support)."""
        ...

    @abstractmethod
    async def resume_execution(self, session_id: str) -> bool:
        """Resume a paused execution."""
        ...
