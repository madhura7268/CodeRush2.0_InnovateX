"""
Research Planner — Placeholder Implementation

Implements: IPlanner

TODO: Implement using an LLM (e.g., GPT-4o via LangChain) to:
    1. Analyze the research question
    2. Break it into discrete, tool-executable steps
    3. Output a structured ResearchPlan using Pydantic's structured output
    4. Validate step dependencies form a valid DAG
    5. Support plan adaptation between iterations (self-evolution)
"""

import uuid
from datetime import datetime
from typing import List

from app.config.settings import Settings
from app.core.logging import get_logger
from app.interfaces.planner import IPlanner
from app.schemas.common import StepStatus, ToolType
from app.schemas.planner import ResearchPlan, TaskStep

logger = get_logger(__name__)

_plans: dict = {}


class ResearchPlanner(IPlanner):
    """
    Placeholder implementation of the Planner.

    Returns a mock research plan so other modules can be developed
    and integrated without waiting for LLM integration.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        logger.info("ResearchPlanner initialized (placeholder)")

    async def generate_plan(self, question: str, session_id: str) -> ResearchPlan:
        """TODO: Use LLM to generate a structured research plan."""
        plan_id = str(uuid.uuid4())
        plan = ResearchPlan(
            plan_id=plan_id,
            session_id=session_id,
            question=question,
            objective=f"[PLACEHOLDER] Research and answer: {question}",
            steps=[
                TaskStep(
                    step_id=str(uuid.uuid4()),
                    order=1,
                    title="Initial Web Search",
                    description=f"Search the web for information about: {question}",
                    tool=ToolType.BROWSER,
                    parameters={"query": question, "max_results": 10},
                    success_criteria="Found at least 5 relevant sources.",
                    status=StepStatus.PENDING,
                ),
                TaskStep(
                    step_id=str(uuid.uuid4()),
                    order=2,
                    title="Store Findings in Memory",
                    description="Store search results in the vector database for RAG.",
                    tool=ToolType.MEMORY,
                    parameters={"collection": "research_results"},
                    dependencies=[],
                    success_criteria="All search results embedded and stored.",
                    status=StepStatus.PENDING,
                ),
                TaskStep(
                    step_id=str(uuid.uuid4()),
                    order=3,
                    title="Evaluate Initial Findings",
                    description="Evaluate the quality and completeness of findings so far.",
                    tool=ToolType.EVALUATION,
                    parameters={},
                    success_criteria="Confidence score calculated.",
                    status=StepStatus.PENDING,
                ),
            ],
            rationale="[PLACEHOLDER] Default 3-step research plan.",
            created_at=datetime.utcnow(),
        )
        _plans[session_id] = plan
        logger.info("Research plan generated (placeholder)", plan_id=plan_id)
        return plan

    async def validate_plan(self, plan: ResearchPlan) -> bool:
        """TODO: Validate step dependencies, tool availability, and step count."""
        return True

    async def adapt_plan(
        self,
        plan: ResearchPlan,
        completed_steps: List[TaskStep],
        iteration: int,
    ) -> ResearchPlan:
        """TODO: Use LLM to adapt remaining steps based on intermediate results."""
        logger.info(
            "Plan adaptation requested (placeholder)",
            session_id=plan.session_id,
            iteration=iteration,
        )
        return plan

    async def get_plan(self, session_id: str) -> ResearchPlan:
        """TODO: Fetch plan from PostgreSQL."""
        if session_id not in _plans:
            from app.core.exceptions import ResourceNotFoundException
            raise ResourceNotFoundException("ResearchPlan", session_id)
        return _plans[session_id]
