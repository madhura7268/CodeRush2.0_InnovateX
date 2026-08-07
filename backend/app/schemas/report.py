"""
Report Module Schemas

Pydantic models for the final structured research report.
"""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.research import Citation


class ExperimentResult(BaseModel):
    """Results from a sandbox code execution experiment."""

    experiment_id: str
    step_id: str
    code: str
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: int
    interpretation: str = Field(
        default="",
        description="Agent's interpretation of what the experiment output means.",
    )


class ReportSection(BaseModel):
    """A named section of the structured report."""

    title: str
    content: str
    citations: list[Citation] = Field(default_factory=list)
    order: int = 1


class StructuredReport(BaseModel):
    """The final structured research report produced after all iterations."""

    report_id: str
    session_id: str
    question: str

    # Summary
    executive_summary: str = Field(
        ..., description="A concise 3-5 paragraph summary of the key findings."
    )

    # Detailed content
    sections: list[ReportSection] = Field(
        default_factory=list,
        description="Detailed report sections (background, findings, analysis, etc.).",
    )

    # Supporting evidence
    all_citations: list[Citation] = Field(
        default_factory=list,
        description="All sources cited across all sections.",
    )
    experiment_results: list[ExperimentResult] = Field(
        default_factory=list,
        description="Results from sandbox code experiments.",
    )

    # Quality metrics
    overall_confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Overall confidence score from the Evaluation module.",
    )
    quality_metrics: dict[str, float] = Field(
        default_factory=dict,
        description="Detailed dimension scores from evaluation.",
    )

    # Methodology
    methodology: str = Field(
        default="",
        description="Description of how the agent conducted the research.",
    )
    total_iterations: int = 0
    total_sources_consulted: int = 0

    # Caveats
    limitations: list[str] = Field(
        default_factory=list,
        description="Known limitations or gaps in the research.",
    )

    generated_at: datetime = Field(default_factory=datetime.utcnow)
    format_version: str = "1.0"
