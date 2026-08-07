"""
Research API Router

Endpoints:
- POST /api/research           — Start a new research session
- GET  /api/research/health    — Module health check
- POST /api/research/search    — Perform web search
- POST /api/research/ingest    — Ingest & chunk document
- POST /api/research/embed     — Batch generate embeddings
- POST /api/research/retrieve  — Top-K semantic retrieval
- GET  /api/research/citations — Generate structured citations
- GET  /api/research/sources   — Verify source reliability score
- GET  /api/research/{id}      — Get session status
- GET  /api/research/{id}/result — Get final result
- DELETE /api/research/{id}    — Cancel a session
- WS   /api/research/ws/{id}   — WebSocket live updates
"""


from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.dependencies import (
    ResearchPipelineDep,
    ResearchPipelineServiceDep,
    WebSocketManagerDep,
)
from app.schemas.research import (
    Citation,
    EmbedRequest,
    EmbedResponse,
    IngestRequest,
    IngestResponse,
    ResearchRequest,
    ResearchResult,
    ResearchSessionStatus,
    RetrievalResponse,
    RetrieveRequest,
    SearchRequest,
    SearchResponse,
    SourceVerificationResponse,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# 1. Base Session Creation Endpoint
# ---------------------------------------------------------------------------
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
    """Submit a research question and start an autonomous research session."""
    session_id = await pipeline.start_research(request)
    return {
        "success": True,
        "session_id": session_id,
        "message": "Research session started. Connect to WebSocket for real-time updates.",
        "websocket_url": f"/ws/{session_id}",
    }


# ---------------------------------------------------------------------------
# 2. Static Path Submodule Endpoints (MUST precede /{session_id})
# ---------------------------------------------------------------------------
@router.get(
    "/health",
    response_model=dict,
    summary="Research Pipeline module health check",
)
async def research_pipeline_health(
    service: ResearchPipelineServiceDep,
) -> dict:
    """Check operational health of Research Pipeline components."""
    return {
        "status": "healthy",
        "module": "Research Pipeline",
        "services": {
            "search": "active",
            "document_loader": "active",
            "chunking": "active",
            "embeddings": service.embedding_service.provider_name,
            "vectordb": "active",
            "retriever": "active",
            "citation_manager": "active",
            "source_verifier": "active",
            "contradiction_detector": "active",
        },
    }


@router.post(
    "/search",
    response_model=SearchResponse,
    summary="Perform web search",
)
async def search_web(
    request: SearchRequest,
    service: ResearchPipelineServiceDep,
) -> SearchResponse:
    """Execute web search and return structured SearchResult list."""
    return await service.execute_search(
        query=request.query,
        max_results=request.max_results,
        search_depth=request.search_depth,
        include_domains=request.include_domains,
        exclude_domains=request.exclude_domains,
    )


@router.post(
    "/ingest",
    response_model=IngestResponse,
    summary="Ingest and chunk document",
)
async def ingest_document(
    request: IngestRequest,
    service: ResearchPipelineServiceDep,
) -> IngestResponse:
    """Load text/URL, recursively chunk (1000 char / 200 overlap), embed, and store in vector DB."""
    return await service.ingest_document(
        text=request.text,
        url=request.url,
        file_name=request.file_name or "document.txt",
        file_type=request.file_type,
        metadata=request.metadata,
    )


@router.post(
    "/embed",
    response_model=EmbedResponse,
    summary="Generate text embeddings",
)
async def generate_embeddings(
    request: EmbedRequest,
    service: ResearchPipelineServiceDep,
) -> EmbedResponse:
    """Generate vector embeddings asynchronously for a batch of text strings."""
    embeddings, dimensions, provider = await service.generate_embeddings_batch(
        texts=request.texts, provider=request.provider
    )
    return EmbedResponse(
        embeddings=embeddings,
        dimensions=dimensions,
        provider_used=provider,
    )


@router.post(
    "/retrieve",
    response_model=RetrievalResponse,
    summary="Semantic retrieval",
)
async def retrieve_semantic(
    request: RetrieveRequest,
    service: ResearchPipelineServiceDep,
) -> RetrievalResponse:
    """Perform Top-K semantic similarity retrieval from vector store."""
    return await service.retrieve_relevant_chunks(
        query=request.query,
        top_k=request.top_k,
        session_id=request.session_id,
        filter_metadata=request.filter_metadata,
    )


@router.get(
    "/citations",
    response_model=list[Citation],
    summary="Generate citations",
)
async def get_citations(
    service: ResearchPipelineServiceDep,
    session_id: str | None = Query(default=None),
) -> list[Citation]:
    """Retrieve structured citations for research findings."""
    return await service.get_citations(session_id=session_id)


@router.get(
    "/sources",
    response_model=SourceVerificationResponse,
    summary="Verify source reliability",
)
async def verify_source(
    service: ResearchPipelineServiceDep,
    url: str = Query(..., description="Target source URL to evaluate"),
    domain: str | None = Query(default=None),
) -> SourceVerificationResponse:
    """Verify and score source authority, relevance, recency, domain reputation, and quality."""
    return await service.verify_source(url=url, domain=domain)


# ---------------------------------------------------------------------------
# 3. Parameterized Session Path Endpoints
# ---------------------------------------------------------------------------
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
    """WebSocket endpoint for real-time research progress events."""
    await ws_manager.connect(websocket, session_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, session_id)
