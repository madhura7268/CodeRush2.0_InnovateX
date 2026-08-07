"""
Interface: IPlanner

Defines the contract for the Research Planner module.

The Planner receives a research question and generates a structured,
step-by-step research plan. It must also validate plans for feasibility
and adapt plans based on intermediate results (self-evolution).

Implementing this module:
    - File: backend/app/planner/planner.py
    - Suggested approach: LLM-based plan generation + structured output parsing
    - Register in backend/app/core/dependencies.py
"""

from abc import ABC, abstractmethod
from typing import List

from app.schemas.planner import ResearchPlan, TaskStep


class IPlanner(ABC):
    """Abstract interface for the autonomous research planner."""

    @abstractmethod
    async def generate_plan(self, question: str, session_id: str) -> ResearchPlan:
        """
        Generate a structured research plan for a given question.

        The plan consists of ordered TaskSteps, each with:
        - A clear action (e.g., "search for", "experiment with", "validate")
        - Required tools (browser, sandbox, memory)
        - Success criteria
        - Dependencies on previous steps

        Args:
            question: The natural language research question.
            session_id: The associated research session ID.

        Returns:
            ResearchPlan: A structured plan with ordered steps.
        """
        ...

    @abstractmethod
    async def validate_plan(self, plan: ResearchPlan) -> bool:
        """
        Validate a research plan for feasibility and safety.

        Checks:
        - All required tools are available
        - No circular dependencies between steps
        - Plan does not exceed MAX_STEPS configuration
        - No obviously unsafe actions

        Args:
            plan: The plan to validate.

        Returns:
            True if plan is valid and can be executed.

        Raises:
            PlannerException: If plan is invalid with detailed reason.
        """
        ...

    @abstractmethod
    async def adapt_plan(
        self,
        plan: ResearchPlan,
        completed_steps: List[TaskStep],
        iteration: int,
    ) -> ResearchPlan:
        """
        Adapt the research plan based on results from previous iterations.

        This is the self-evolution component of the Planner.
        After each research iteration, the planner reviews the intermediate
        results and modifies the remaining steps to improve the research strategy.

        Args:
            plan: The original research plan.
            completed_steps: Steps that have already been executed.
            iteration: Current iteration number (1-indexed).

        Returns:
            An adapted ResearchPlan with modified remaining steps.
        """
        ...

    @abstractmethod
    async def get_plan(self, session_id: str) -> ResearchPlan:
        """
        Retrieve the current plan for a research session.

        Args:
            session_id: The session to retrieve the plan for.

        Returns:
            The current ResearchPlan (may have been adapted).
        """
        ...
