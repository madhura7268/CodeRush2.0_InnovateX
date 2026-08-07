"""
Report API Router

GET /api/report/{session_id}              — Get the structured report
GET /api/report/{session_id}/export       — Export as markdown/json/html
"""

from fastapi import APIRouter, Query
from fastapi.responses import PlainTextResponse

from app.core.dependencies import ReportGeneratorDep
from app.schemas.report import StructuredReport

router = APIRouter()


@router.get(
    "/{session_id}",
    response_model=StructuredReport,
    summary="Get the structured research report",
)
async def get_report(
    session_id: str,
    report_generator: ReportGeneratorDep,
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
    return await report_generator.get_report(session_id)


@router.get(
    "/{session_id}/export",
    response_class=PlainTextResponse,
    summary="Export report in specified format",
)
async def export_report(
    session_id: str,
    report_generator: ReportGeneratorDep,
    format: str = Query(default="markdown", pattern="^(markdown|json|html)$"),
) -> str:
    """
    Export the research report in the specified format.

    Supported formats: markdown, json, html
    """
    return await report_generator.export_report(session_id, format)
