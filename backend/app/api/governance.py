"""
Governance API Router

POST /api/governance/check           — Manually check an action against policies
GET  /api/governance/audit/{id}      — Get governance audit log for a session
GET  /api/governance/policies        — Get the active policy registry
"""


from fastapi import APIRouter, Query

from app.core.dependencies import GovernanceEngineDep
from app.schemas.governance import AuditLogEntry, PolicyCheckRequest, PolicyCheckResult, GovernancePermission

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
    response_model=list[GovernancePermission],
    summary="Get active policy registry",
)
async def get_policies(governance: GovernanceEngineDep) -> list[GovernancePermission]:
    """Return all active governance policies and their configurations."""
    return [
        GovernancePermission(
            action="web_search",
            label="Web Search",
            status="ALLOWED",
            description="Permitted domain-restricted search via SerpAPI/Tavily."
        ),
        GovernancePermission(
            action="browser_automation",
            label="Browser",
            status="ALLOWED",
            description="Headless Playwright scraper for public HTML rendering."
        ),
        GovernancePermission(
            action="rag_retrieval",
            label="RAG DB",
            status="ALLOWED",
            description="Internal ChromaDB vector store embeddings lookup."
        ),
        GovernancePermission(
            action="sandbox_execution",
            label="Sandbox",
            status="ALLOWED",
            description="Isolated Docker container execution for Python benchmarks."
        ),
        GovernancePermission(
            action="file_access",
            label="File Access",
            status="BLOCKED",
            description="Access to host system files outside sandbox container blocked."
        ),
        GovernancePermission(
            action="system_commands",
            label="System Commands",
            status="BLOCKED",
            description="Execution of arbitrary OS shell commands strictly blocked."
        ),
        GovernancePermission(
            action="external_action",
            label="External Action",
            status="HUMAN APPROVAL",
            description="Sending emails, API modifications, or API payments requires human sign-off."
        )
    ]

