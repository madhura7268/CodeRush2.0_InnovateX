"""
Research API Router

POST /api/research          — Start a new research session
GET  /api/research/{id}     — Get session status
GET  /api/research/{id}/result — Get final result
DELETE /api/research/{id}   — Cancel a session

All routes inject IResearchPipeline via Depends() — the concrete
implementation is wired in app/core/dependencies.py.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.dependencies import ResearchPipelineDep, WebSocketManagerDep
from app.schemas.research import ResearchRequest, ResearchResult, ResearchSessionStatus

router = APIRouter()


@router.post(
    "",
    response_model=dict,
    status_code=202,
    summary="Start a research session",
)
async def start_research(
    request: ResearchRequest,
    pipeline: ResearchPipelineDep,
) -> dict:
    """
    Submit a research question and start an autonomous research session.

    Returns a session_id immediately. Use GET /api/research/{id} to poll status
    or connect to WS /ws/{id} for real-time events.
    """
    session_id = await pipeline.start_research(request)
    return {
        "success": True,
        "session_id": session_id,
        "message": "Research session started. Connect to WebSocket for real-time updates.",
        "websocket_url": f"/ws/{session_id}",
    }


@router.get(
    "/{session_id}",
    response_model=ResearchSessionStatus,
    summary="Get research session status",
)
async def get_session_status(
    session_id: str,
    pipeline: ResearchPipelineDep,
) -> ResearchSessionStatus:
    """Retrieve the current status, progress, and metadata for a research session."""
    return await pipeline.get_session_status(session_id)


@router.get(
    "/{session_id}/result",
    response_model=ResearchResult,
    summary="Get research session result",
)
async def get_session_result(
    session_id: str,
    pipeline: ResearchPipelineDep,
) -> ResearchResult:
    """Retrieve the final findings and report reference for a completed session."""
    return await pipeline.get_result(session_id)


@router.delete(
    "/{session_id}",
    response_model=dict,
    summary="Cancel a research session",
)
async def cancel_session(
    session_id: str,
    pipeline: ResearchPipelineDep,
) -> dict:
    """Cancel a running research session."""
    cancelled = await pipeline.cancel_session(session_id)
    return {"success": cancelled, "session_id": session_id}


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    ws_manager: WebSocketManagerDep,
) -> None:
    """
    WebSocket endpoint for real-time research progress events.

    Events emitted:
    - session_started
    - step_started / step_completed / step_failed
    - iteration_evaluated
    - session_completed / session_failed
    """
    await ws_manager.connect(websocket, session_id)
    try:
        while True:
            # Keep connection alive; data is pushed server-side via ws_manager.broadcast()
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, session_id)
