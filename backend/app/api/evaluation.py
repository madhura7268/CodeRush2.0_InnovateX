"""
Evaluation API Router

GET /api/evaluation/{session_id}         — Get the latest evaluation result
GET /api/evaluation/{session_id}/history — Get all evaluation results across iterations
"""


from fastapi import APIRouter

from app.core.dependencies import EvaluationDep
from app.schemas.evaluation import EvaluationResult, IterationEvaluation

router = APIRouter()


@router.get(
    "/{session_id}",
    response_model=EvaluationResult,
    summary="Get latest evaluation result",
)
async def get_evaluation(
    session_id: str,
    evaluation: EvaluationDep,
) -> EvaluationResult:
    """Get the most recent evaluation result for a research session."""
    history = await evaluation.get_iteration_history(session_id)
    if not history:
        return EvaluationResult(
            evaluation_id="placeholder",
            session_id=session_id,
            iteration=0,
            overall_confidence=0.0,
            should_continue=True,
            improvement_suggestions=["Research has not started yet."],
        )
    # Return the latest evaluation
    latest = max(history, key=lambda e: e.iteration)
    return EvaluationResult(
        evaluation_id=f"{session_id}-eval-{latest.iteration}",
        session_id=session_id,
        iteration=latest.iteration,
        overall_confidence=latest.overall_confidence,
        should_continue=latest.should_continue,
    )


@router.get(
    "/{session_id}/history",
    response_model=list[IterationEvaluation],
    summary="Get evaluation history for all iterations",
)
async def get_evaluation_history(
    session_id: str,
    evaluation: EvaluationDep,
) -> list[IterationEvaluation]:
    """Retrieve evaluation scores across all iterations for trend analysis."""
    return await evaluation.get_iteration_history(session_id)
