"""
Evaluation Module Schemas

Pydantic models for evaluation results and quality scoring.
"""

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class DimensionScore(BaseModel):
    """Score for a single evaluation dimension."""

    dimension: str
    score: float = Field(ge=0.0, le=1.0)
    reasoning: str = ""


class EvaluationResult(BaseModel):
    """Evaluation result for a single research iteration."""

    evaluation_id: str
    session_id: str
    iteration: int
    overall_confidence: float = Field(ge=0.0, le=1.0)
    dimension_scores: List[DimensionScore] = Field(default_factory=list)
    should_continue: bool = Field(
        ...,
        description="Whether the agent should run another research iteration.",
    )
    improvement_suggestions: List[str] = Field(
        default_factory=list,
        description="Suggestions for the Planner to improve the next iteration.",
    )
    evaluated_at: datetime = Field(default_factory=datetime.utcnow)


class IterationEvaluation(BaseModel):
    """Summary of evaluation for a single iteration, used in history views."""

    iteration: int
    overall_confidence: float = Field(ge=0.0, le=1.0)
    dimension_scores: Dict[str, float] = Field(default_factory=dict)
    should_continue: bool
    evaluated_at: datetime
