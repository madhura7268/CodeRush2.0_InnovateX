"""
Common Pydantic schemas shared across multiple modules.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class SessionStatus(str, Enum):
    """Lifecycle states of a research session."""
    PENDING = "pending"
    PLANNING = "planning"
    RUNNING = "running"
    PAUSED = "paused"
    EVALUATING = "evaluating"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class StepStatus(str, Enum):
    """Lifecycle states of a single task step."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    BLOCKED = "blocked"   # Blocked by governance


class ToolType(str, Enum):
    """Available tools the agent can invoke."""
    BROWSER = "browser"
    SANDBOX = "sandbox"
    MEMORY = "memory"
    EVALUATION = "evaluation"
    PLANNER = "planner"


class BaseResponse(BaseModel):
    """Base class for all API responses."""
    success: bool = True
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Standard error response structure."""
    success: bool = False
    error: str
    message: str
    details: dict | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
