"""
Research Module Schemas

Pydantic models for research session requests, responses, and data objects.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import SessionStatus


class ResearchRequest(BaseModel):
    """Request body to start a new research session."""

    question: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="The research question or topic to investigate.",
        examples=["What are the latest advances in quantum computing error correction?"],
    )
    max_iterations: Optional[int] = Field(
        default=None,
        ge=1,
        le=10,
        description="Override for maximum research iterations (defaults to settings).",
    )
    confidence_threshold: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Stop research when this confidence score is reached.",
    )
    enable_sandbox: bool = Field(
        default=True,
        description="Whether to allow the agent to run code experiments.",
    )
    tags: List[str] = Field(
        default_factory=list,
        description="Optional tags for categorizing this research session.",
    )


class ResearchSessionStatus(BaseModel):
    """Current status of a research session."""

    session_id: str
    status: SessionStatus
    question: str
    current_iteration: int = 0
    max_iterations: int
    current_step: Optional[str] = None
    progress_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    created_at: datetime
    updated_at: datetime
    estimated_completion: Optional[datetime] = None


class SearchResult(BaseModel):
    """A single search result from the browser tool."""

    title: str
    url: str
    content: str
    relevance_score: float = Field(ge=0.0, le=1.0)
    source_domain: Optional[str] = None
    published_date: Optional[str] = None


class Citation(BaseModel):
    """A source citation for a research finding."""

    title: str
    url: str
    source_domain: str
    accessed_at: datetime = Field(default_factory=datetime.utcnow)
    excerpt: Optional[str] = None
    relevance_score: float = Field(ge=0.0, le=1.0)


class ResearchFinding(BaseModel):
    """A single research finding from one iteration."""

    finding_id: str
    session_id: str
    iteration: int
    content: str
    citations: List[Citation] = Field(default_factory=list)
    tool_used: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ResearchResult(BaseModel):
    """Final result of a completed research session."""

    session_id: str
    question: str
    status: SessionStatus
    findings: List[ResearchFinding]
    total_iterations: int
    overall_confidence: float = Field(ge=0.0, le=1.0)
    report_id: Optional[str] = None
    completed_at: Optional[datetime] = None
