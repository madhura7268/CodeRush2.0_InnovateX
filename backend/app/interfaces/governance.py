"""
Interface: IGovernanceEngine

Defines the contract for the Safety & Policy Governance Engine.

The Governance Engine is the safety layer of the research agent.
Before EVERY agent action, the Governance Engine is consulted.
If a policy check fails, a GovernanceViolationException is raised
and the action is blocked.

Policy types:
    - CONTENT_POLICY: Blocks harmful, illegal, or unethical research
    - RESOURCE_POLICY: Limits memory, CPU, and API usage
    - SANDBOX_POLICY: Enforces sandbox isolation rules
    - NETWORK_POLICY: Controls external network access
    - DATA_POLICY: Prevents exfiltration of sensitive data

Implementing this module:
    - File: backend/app/governance/governance.py
    - Consider LLM-based policy evaluation for content checks
    - Register in backend/app/core/dependencies.py
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List

from app.schemas.governance import (
    AuditLogEntry,
    PolicyCheckRequest,
    PolicyCheckResult,
)


class IGovernanceEngine(ABC):
    """Abstract interface for the safety and policy governance engine."""

    @abstractmethod
    async def check_action(self, request: PolicyCheckRequest) -> PolicyCheckResult:
        """
        Check whether an agent action is permitted under all applicable policies.

        This is called before EVERY tool invocation in the orchestrator.
        If this raises GovernanceViolationException, the action is blocked.

        Args:
            request: The action to check (action_type, params, session_id, context).

        Returns:
            PolicyCheckResult with allowed=True/False, matched_policies, and reason.

        Raises:
            GovernanceViolationException: If strict mode is ON and action is blocked.
        """
        ...

    @abstractmethod
    async def check_content(self, content: str, context: str = "") -> PolicyCheckResult:
        """
        Check whether a piece of content (query, code, web content) is safe.

        Used to:
        - Validate the initial research question
        - Check code before sandbox execution
        - Screen web content before it enters the RAG memory

        Args:
            content: The content to evaluate.
            context: Additional context about how content will be used.

        Returns:
            PolicyCheckResult with safety assessment.
        """
        ...

    @abstractmethod
    async def get_audit_log(
        self, session_id: str, limit: int = 50
    ) -> List[AuditLogEntry]:
        """
        Retrieve the governance audit log for a session.

        Every check performed by the governance engine is logged here,
        whether it passed or was blocked. This provides full auditability.

        Args:
            session_id: The session to retrieve logs for.
            limit: Maximum number of log entries to return.

        Returns:
            List of AuditLogEntry sorted by timestamp descending.
        """
        ...

    @abstractmethod
    async def get_policy_registry(self) -> Dict[str, Any]:
        """
        Return the current policy registry (all active policies and their rules).

        Used by the Governance dashboard in the frontend to display
        active policies and their status.
        """
        ...
