"""
Governance Module Schemas

Pydantic models for policy checks and audit logging.
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class PolicyType(str, Enum):
    CONTENT = "content_policy"
    RESOURCE = "resource_policy"
    SANDBOX = "sandbox_policy"
    NETWORK = "network_policy"
    DATA = "data_policy"


class PolicyVerdictType(str, Enum):
    ALLOW = "allow"
    BLOCK = "block"
    WARN = "warn"


class PolicyCheckRequest(BaseModel):
    """Request to check an agent action against governance policies."""

    action_type: str = Field(
        ...,
        description="The type of action (e.g., 'web_search', 'execute_code', 'store_data').",
    )
    action_params: dict[str, Any] = Field(
        default_factory=dict,
        description="Parameters of the action being checked.",
    )
    session_id: str = Field(..., description="The research session this action belongs to.")
    step_id: str | None = Field(default=None, description="The step requesting this action.")
    context: str | None = Field(
        default=None,
        description="Additional context about why this action is needed.",
    )


class PolicyCheckResult(BaseModel):
    """Result of a governance policy check."""

    allowed: bool
    verdict: PolicyVerdictType
    matched_policies: list[str] = Field(
        default_factory=list,
        description="Names of policies that were triggered.",
    )
    reason: str = Field(..., description="Human-readable explanation of the verdict.")
    warnings: list[str] = Field(
        default_factory=list,
        description="Non-blocking warnings for the operator.",
    )
    checked_at: datetime = Field(default_factory=datetime.utcnow)


class AuditLogEntry(BaseModel):
    """A single entry in the governance audit log."""

    log_id: str
    session_id: str
    step_id: str | None = None
    action_type: str
    action_params: dict[str, Any]
    verdict: PolicyVerdictType
    matched_policies: list[str]
    reason: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
