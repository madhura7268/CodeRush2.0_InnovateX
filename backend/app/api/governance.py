"""
Governance API Router

POST /api/governance/check           — Manually check an action against policies
GET  /api/governance/audit/{id}      — Get governance audit log for a session
GET  /api/governance/policies        — Get the active policy registry
"""


from fastapi import APIRouter, Query

from app.core.dependencies import GovernanceEngineDep
from app.schemas.governance import AuditLogEntry, PolicyCheckRequest, PolicyCheckResult

router = APIRouter()


@router.post(
    "/check",
    response_model=PolicyCheckResult,
    summary="Check an action against governance policies",
)
async def check_action(
    request: PolicyCheckRequest,
    governance: GovernanceEngineDep,
) -> PolicyCheckResult:
    """
    Manually invoke the governance engine to check whether an action is permitted.
    Useful for testing policy configurations without running a full research session.
    """
    return await governance.check_action(request)


@router.get(
    "/audit/{session_id}",
    response_model=list[AuditLogEntry],
    summary="Get governance audit log",
)
async def get_audit_log(
    session_id: str,
    governance: GovernanceEngineDep,
    limit: int = Query(default=50, ge=1, le=500),
) -> list[AuditLogEntry]:
    """Retrieve the full governance audit trail for a research session."""
    return await governance.get_audit_log(session_id, limit=limit)


@router.get(
    "/policies",
    response_model=dict,
    summary="Get active policy registry",
)
async def get_policies(governance: GovernanceEngineDep) -> dict:
    """Return all active governance policies and their configurations."""
    return await governance.get_policy_registry()
