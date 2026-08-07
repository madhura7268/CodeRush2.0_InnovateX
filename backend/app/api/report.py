"""
Report API Router

GET /api/report/{session_id}              — Get the structured report
GET /api/report/{session_id}/export       — Export as markdown/json/html
"""

from fastapi import APIRouter, Query
from fastapi.responses import PlainTextResponse

from app.core.dependencies import ResearchPipelineDep
from app.schemas.report import StructuredReport

router = APIRouter()


@router.get(
    "/{session_id}",
    response_model=StructuredReport,
    summary="Get the structured research report",
)
async def get_report(
    session_id: str,
    pipeline: ResearchPipelineDep,
) -> StructuredReport:
    """
    Retrieve the final structured research report for a completed session.

    The report includes:
    - Executive summary
    - Detailed sections with citations
    - Experiment results
    - Confidence score and quality metrics
    - Research methodology
    """
    # NOTE: When report generation is implemented, inject IReportGenerator
    # and call report_generator.get_report(session_id)
    # For now, return a placeholder response.
    return StructuredReport(
        report_id=f"report-{session_id}",
        session_id=session_id,
        question="Placeholder — report not yet generated.",
        executive_summary=(
            "This is a placeholder report. "
            "The Report Generator module has not yet been implemented."
        ),
        overall_confidence=0.0,
    )


@router.get(
    "/{session_id}/export",
    response_class=PlainTextResponse,
    summary="Export report in specified format",
)
async def export_report(
    session_id: str,
    format: str = Query(default="markdown", pattern="^(markdown|json|html)$"),
) -> str:
    """
    Export the research report in the specified format.

    Supported formats: markdown, json, html
    """
    # NOTE: Implement using IReportGenerator.export_report() when available.
    return f"# Report Export\n\nPlaceholder export in {format} format for session {session_id}."
