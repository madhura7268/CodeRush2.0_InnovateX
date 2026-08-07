"""
Custom Exceptions and Exception Handlers

Defines the exception hierarchy for the Research Agent system.
All domain exceptions inherit from AgentException so they can
be caught uniformly at the API boundary.

Exception Hierarchy:
    Exception
    └── AgentException
        ├── GovernanceViolationException   (403)
        ├── ResearchException              (500)
        │   ├── PlannerException           (500)
        │   └── OrchestratorException      (500)
        ├── SandboxException               (500)
        │   └── SandboxTimeoutException    (408)
        ├── MemoryException                (500)
        ├── EvaluationException            (500)
        └── ResourceNotFoundException      (404)

Usage:
    raise GovernanceViolationException(
        policy="NO_EXTERNAL_WRITE",
        action="write_to_filesystem",
        reason="Action violates sandbox isolation policy."
    )
"""

from typing import Any, Dict, Optional

from fastapi import Request
from fastapi.responses import JSONResponse


# ---------------------------------------------------------------------------
# Base Exception
# ---------------------------------------------------------------------------
class AgentException(Exception):
    """
    Base class for all domain-level exceptions in the Research Agent system.

    All module-specific exceptions should inherit from this class so that
    the global exception handler can provide consistent error responses.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


# ---------------------------------------------------------------------------
# Governance Exceptions
# ---------------------------------------------------------------------------
class GovernanceViolationException(AgentException):
    """
    Raised when the Governance Engine blocks an action.

    The Governance Engine checks every agent action against the safety
    policy registry before it is executed. If a violation is detected,
    this exception is raised and the action is aborted.
    """

    def __init__(
        self,
        policy: str,
        action: str,
        reason: str,
        session_id: Optional[str] = None,
    ) -> None:
        super().__init__(
            message=f"Governance violation: action '{action}' blocked by policy '{policy}'.",
            status_code=403,
            details={
                "policy": policy,
                "action": action,
                "reason": reason,
                "session_id": session_id,
            },
        )
        self.policy = policy
        self.action = action
        self.reason = reason


# ---------------------------------------------------------------------------
# Research Pipeline Exceptions
# ---------------------------------------------------------------------------
class ResearchException(AgentException):
    """Raised when the research pipeline encounters an unrecoverable error."""

    def __init__(self, message: str, session_id: Optional[str] = None) -> None:
        super().__init__(message, 500, {"session_id": session_id})


class PlannerException(ResearchException):
    """Raised when the planner fails to generate or validate a research plan."""
    pass


class OrchestratorException(ResearchException):
    """Raised when the agent orchestrator encounters an error during execution."""
    pass


# ---------------------------------------------------------------------------
# Sandbox Exceptions
# ---------------------------------------------------------------------------
class SandboxException(AgentException):
    """Raised when the Docker sandbox encounters an error."""

    def __init__(self, message: str, container_id: Optional[str] = None) -> None:
        super().__init__(message, 500, {"container_id": container_id})


class SandboxTimeoutException(SandboxException):
    """Raised when a sandbox execution exceeds the allowed time limit."""

    def __init__(self, timeout_seconds: int, container_id: Optional[str] = None) -> None:
        super().__init__(
            message=f"Sandbox execution timed out after {timeout_seconds}s.",
            container_id=container_id,
        )
        self.status_code = 408


# ---------------------------------------------------------------------------
# Other Domain Exceptions
# ---------------------------------------------------------------------------
class MemoryException(AgentException):
    """Raised when the memory/RAG module encounters an error."""
    pass


class EvaluationException(AgentException):
    """Raised when the evaluation module cannot score a result."""
    pass


class ResourceNotFoundException(AgentException):
    """Raised when a requested resource (session, report, plan) does not exist."""

    def __init__(self, resource_type: str, resource_id: str) -> None:
        super().__init__(
            message=f"{resource_type} with id '{resource_id}' not found.",
            status_code=404,
            details={"resource_type": resource_type, "resource_id": resource_id},
        )


# ---------------------------------------------------------------------------
# Exception Handlers (registered in main.py)
# ---------------------------------------------------------------------------
async def governance_violation_handler(
    request: Request, exc: GovernanceViolationException
) -> JSONResponse:
    """Returns a 403 response with governance violation details."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "governance_violation",
            "message": exc.message,
            "details": exc.details,
        },
    )


async def agent_exception_handler(
    request: Request, exc: AgentException
) -> JSONResponse:
    """Returns a structured error response for all agent-level exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": type(exc).__name__,
            "message": exc.message,
            "details": exc.details,
        },
    )


async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Catches all unhandled exceptions and returns a generic 500 response."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred. Please try again or contact support.",
        },
    )
