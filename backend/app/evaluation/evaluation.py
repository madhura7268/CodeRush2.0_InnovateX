"""
Evaluation Service — Placeholder Implementation

Implements: IEvaluation

TODO: Implement using LLM-as-judge approach:
    1. Build evaluation prompt with the original question + findings
    2. Call LLM with structured output (Pydantic model with dimension scores)
    3. Calculate overall_confidence as weighted average of dimension scores
    4. Determine should_continue based on confidence vs. threshold
    5. Generate improvement suggestions for the Planner

Dimensions to evaluate (suggested weights):
    - relevance: 0.30    (Is this on-topic?)
    - completeness: 0.25 (Did we cover all aspects?)
    - accuracy: 0.25     (Are sources credible?)
    - consistency: 0.10  (No contradictions?)
    - depth: 0.10        (Sufficient detail?)
"""

import uuid
from datetime import datetime
from typing import List

from app.config.settings import Settings
from app.core.logging import get_logger
from app.interfaces.evaluation import IEvaluation
from app.schemas.evaluation import DimensionScore, EvaluationResult, IterationEvaluation
from app.schemas.research import ResearchFinding

logger = get_logger(__name__)

_evaluation_history: Dict = {}

from typing import Dict


class EvaluationService(IEvaluation):
    """
    Placeholder implementation of the Evaluation module.

    Returns mock scores so the pipeline can be tested end-to-end.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        logger.info("EvaluationService initialized (placeholder)")

    async def evaluate_findings(
        self,
        question: str,
        findings: List[ResearchFinding],
        session_id: str,
        iteration: int,
    ) -> EvaluationResult:
        """TODO: Use LLM-as-judge to score findings on multiple dimensions."""
        logger.info(
            "Evaluating findings (placeholder)",
            session_id=session_id,
            iteration=iteration,
            num_findings=len(findings),
        )
        result = EvaluationResult(
            evaluation_id=str(uuid.uuid4()),
            session_id=session_id,
            iteration=iteration,
            overall_confidence=0.5,  # Mock score
            dimension_scores=[
                DimensionScore(dimension="relevance", score=0.5, reasoning="Placeholder"),
                DimensionScore(dimension="completeness", score=0.5, reasoning="Placeholder"),
                DimensionScore(dimension="accuracy", score=0.5, reasoning="Placeholder"),
                DimensionScore(dimension="consistency", score=0.5, reasoning="Placeholder"),
                DimensionScore(dimension="depth", score=0.5, reasoning="Placeholder"),
            ],
            should_continue=True,
            improvement_suggestions=[
                "[PLACEHOLDER] Implement real evaluation to get improvement suggestions."
            ],
            evaluated_at=datetime.utcnow(),
        )
        if session_id not in _evaluation_history:
            _evaluation_history[session_id] = []
        _evaluation_history[session_id].append(result)
        return result

    async def compare_iterations(
        self, session_id: str, iteration_a: int, iteration_b: int
    ) -> dict:
        """TODO: Compare dimension scores between two iterations."""
        return {
            "session_id": session_id,
            "iteration_a": iteration_a,
            "iteration_b": iteration_b,
            "delta": 0.0,
            "verdict": "placeholder — comparison not implemented",
        }

    async def get_iteration_history(
        self, session_id: str
    ) -> List[IterationEvaluation]:
        """TODO: Fetch from PostgreSQL evaluation table."""
        raw = _evaluation_history.get(session_id, [])
        return [
            IterationEvaluation(
                iteration=r.iteration,
                overall_confidence=r.overall_confidence,
                dimension_scores={d.dimension: d.score for d in r.dimension_scores},
                should_continue=r.should_continue,
                evaluated_at=r.evaluated_at,
            )
            for r in raw
        ]
