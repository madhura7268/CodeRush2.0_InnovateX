"""
Planner API Router

GET /api/planner/{session_id}    — Get the research plan for a session
"""

from fastapi import APIRouter

from app.core.dependencies import PlannerDep
from app.schemas.planner import ResearchPlan

router = APIRouter()


@router.get(
    "/{session_id}",
    response_model=ResearchPlan,
    summary="Get research plan",
)
async def get_research_plan(
    session_id: str,
    planner: PlannerDep,
) -> ResearchPlan:
    """
    Retrieve the current research plan (and its current step statuses) for a session.
    The plan may have been adapted between iterations.
    """
    return await planner.get_plan(session_id)
