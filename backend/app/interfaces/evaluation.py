"""
Interface: IEvaluation

Defines the contract for the Quality Evaluation module.

The Evaluation module assesses the quality of research findings after each
iteration. It produces a confidence score and detailed quality metrics that
the Planner uses to decide whether to continue or stop research.

Evaluation dimensions:
    - RELEVANCE: How relevant are the findings to the original question?
    - COMPLETENESS: How completely does the answer address the question?
    - ACCURACY: How well-sourced and factual are the findings?
    - CONSISTENCY: Are the findings internally consistent?
    - DEPTH: How deep and detailed are the findings?

Implementing this module:
    - File: backend/app/evaluation/evaluation.py
    - Suggested approach: LLM-as-judge with structured output
    - Register in backend/app/core/dependencies.py
"""

from abc import ABC, abstractmethod

from app.schemas.evaluation import (
    EvaluationResult,
    IterationEvaluation,
)
from app.schemas.research import ResearchFinding


class IEvaluation(ABC):
    """Abstract interface for the research quality evaluation module."""

    @abstractmethod
    async def evaluate_findings(
        self,
        question: str,
        findings: list[ResearchFinding],
        session_id: str,
        iteration: int,
    ) -> EvaluationResult:
        """
        Evaluate the quality of research findings for a given iteration.

        Args:
            question: The original research question.
            findings: List of findings collected during this iteration.
            session_id: The research session ID.
            iteration: Current iteration number (1-indexed).

        Returns:
            EvaluationResult with:
                - overall_confidence: float [0.0, 1.0]
                - dimension_scores: dict of relevance, completeness, accuracy, etc.
                - should_continue: bool (True if more research is needed)
                - improvement_suggestions: List[str] for the Planner to use
        """
        ...

    @abstractmethod
    async def compare_iterations(
        self,
        session_id: str,
        iteration_a: int,
        iteration_b: int,
    ) -> dict:
        """
        Compare the quality of findings between two research iterations.

        Used by the Planner to assess whether the self-evolution improved results.

        Args:
            session_id: The research session.
            iteration_a: First iteration to compare.
            iteration_b: Second iteration to compare.

        Returns:
            Comparison dict with delta scores per dimension and overall verdict.
        """
        ...

    @abstractmethod
    async def get_iteration_history(
        self, session_id: str
    ) -> list[IterationEvaluation]:
        """
        Retrieve evaluation history across all iterations for a session.

        Args:
            session_id: The session to retrieve history for.

        Returns:
            List of IterationEvaluation ordered by iteration number.
        """
        ...
