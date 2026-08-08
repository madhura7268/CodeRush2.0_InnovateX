"""
Interface: IResearchPipeline

Defines the contract for the Research Pipeline module.

The Research Pipeline orchestrates the end-to-end research workflow:
    1. Accept a research question
    2. Delegate to Planner for step generation
    3. Invoke Orchestrator to execute steps (browser, sandbox, memory)
    4. Apply Governance checks before each step
    5. Run Evaluation after each iteration
    6. Loop until stopping criteria met (max iterations or confidence threshold)
    7. Invoke ReportGenerator for final output

Implementing this module:
    - File: backend/app/research/pipeline.py
    - Implement all abstract methods
    - Register in backend/app/core/dependencies.py
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator

from app.schemas.research import (
    ResearchRequest,
    ResearchResult,
    ResearchSessionStatus,
    ResearchHistoryItem,
)


class IResearchPipeline(ABC):
    """Abstract interface for the end-to-end research pipeline."""

    @abstractmethod
    async def get_history(self, user_id: str | None = None) -> list[ResearchHistoryItem]:
        """
        Retrieve history of research sessions, optionally filtered by user_id.

        Returns:
            list[ResearchHistoryItem]
        """
        ...

    @abstractmethod
    async def start_research(
        self, request: ResearchRequest, user_id: str | None = None
    ) -> str:
        """
        Start a new research session associated with a user_id.

        Args:
            request: The research request containing the question and configuration.
            user_id: The authenticated user's ID.

        Returns:
            session_id: A unique identifier for this research session.
        """
        ...

    @abstractmethod
    async def get_session_status(self, session_id: str) -> ResearchSessionStatus:
        """
        Retrieve the current status of a research session.

        Args:
            session_id: The session to query.

        Returns:
            ResearchSessionStatus with current state, progress, and timestamps.

        Raises:
            ResourceNotFoundException: If session_id does not exist.
        """
        ...

    @abstractmethod
    async def get_result(self, session_id: str) -> ResearchResult:
        """
        Retrieve the final result of a completed research session.

        Args:
            session_id: The completed session to retrieve results for.

        Returns:
            ResearchResult with findings, confidence score, and report reference.

        Raises:
            ResourceNotFoundException: If session_id does not exist.
            ResearchException: If session is not yet complete.
        """
        ...

    @abstractmethod
    async def stream_progress(self, session_id: str) -> AsyncGenerator[dict, None]:
        """
        Stream real-time progress events for a research session.

        Yields:
            dict: Progress event with type, message, and metadata.
                  Used by the WebSocket manager to push events to the frontend.
        """
        ...

    @abstractmethod
    async def cancel_session(self, session_id: str) -> bool:
        """
        Cancel a running research session.

        Args:
            session_id: The session to cancel.

        Returns:
            True if successfully cancelled, False otherwise.
        """
        ...
