"""
Interface: IReportGenerator

Defines the contract for the Report Generator module.

The Report Generator produces the final structured research report
after all iterations are complete and the evaluation confidence threshold
has been met (or max iterations reached).

Report structure:
    - Executive summary
    - Detailed findings with supporting evidence
    - Citations with full source metadata
    - Experiment results (sandbox outputs)
    - Confidence score and quality metrics
    - Methodology description (how the agent researched)
    - Limitations and caveats

Implementing this module:
    - File: backend/app/research/report_generator.py (or a new reports/ folder)
    - Suggested approach: LLM-based synthesis + structured Pydantic output
    - Register in backend/app/core/dependencies.py
"""

from abc import ABC, abstractmethod

from app.schemas.report import StructuredReport


class IReportGenerator(ABC):
    """Abstract interface for the structured research report generator."""

    @abstractmethod
    async def generate_report(self, session_id: str) -> StructuredReport:
        """
        Generate the final structured research report for a completed session.

        Synthesizes all findings, citations, experiment results, and evaluation
        scores into a cohesive, well-structured report.

        Args:
            session_id: The completed research session to generate a report for.

        Returns:
            StructuredReport with all sections filled.

        Raises:
            ResourceNotFoundException: If session does not exist.
            ResearchException: If session is not yet complete.
        """
        ...

    @abstractmethod
    async def get_report(self, session_id: str) -> StructuredReport:
        """
        Retrieve a previously generated report.

        Args:
            session_id: The session whose report to retrieve.

        Returns:
            The cached StructuredReport.

        Raises:
            ResourceNotFoundException: If no report exists for this session.
        """
        ...

    @abstractmethod
    async def export_report(
        self, session_id: str, format: str = "markdown"
    ) -> str:
        """
        Export the report in a specified format.

        Args:
            session_id: The session whose report to export.
            format: Output format: "markdown", "json", or "html".

        Returns:
            The report as a formatted string.
        """
        ...
