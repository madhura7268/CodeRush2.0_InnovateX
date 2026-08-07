"""
Tests for Research Pipeline Module

Comprehensive test suite testing all 9 sub-services and REST API endpoints:
1. Search Service
2. Document Loader
3. Recursive Chunker
4. Embedding Service
5. Vector Database Service
6. Semantic Retriever
7. Citation Manager
8. Source Verifier
9. Contradiction Detector
10. All REST API endpoints
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.config.settings import get_settings
from app.main import app
from app.research.chunking.recursive_chunker import RecursiveChunker
from app.research.citation.citation_manager import CitationManager
from app.research.document_loader.document_loader import DocumentLoader
from app.research.embeddings.embedding_service import EmbeddingService
from app.research.evidence.contradiction_detector import ContradictionDetector
from app.research.retriever.semantic_retriever import SemanticRetriever
from app.research.search.search_service import MockSearchProvider, SearchService
from app.research.vectordb.chroma_db import VectorDatabaseService
from app.research.verification.source_verifier import SourceVerifier


@pytest.mark.asyncio
async def test_search_service():
    """Test SearchService with MockSearchProvider fallback."""
    settings = get_settings()
    service = SearchService(settings=settings, provider=MockSearchProvider())
    results = await service.search(query="quantum computing", max_results=3)

    assert len(results) == 3
    assert "Quantum" in results[0].title
    assert results[0].url.startswith("https://")
    assert results[0].relevance_score > 0.5


@pytest.mark.asyncio
async def test_document_loader():
    """Test DocumentLoader across text and HTML formats."""
    loader = DocumentLoader()

    # Text loading
    doc_txt = await loader.load_from_text(
        text="Sample text content for research.", title="Sample.txt"
    )
    assert doc_txt.title == "Sample.txt"
    assert doc_txt.file_type == "txt"
    assert doc_txt.content == "Sample text content for research."

    # HTML loading
    doc_html = await loader.load_from_html(
        html_content="<html><body><h1>Title</h1><p>Paragraph text.</p></body></html>",
        title="WebPage",
        url="https://example.com/page",
    )
    assert doc_html.file_type == "html"
    assert "Paragraph text." in doc_html.content


@pytest.mark.asyncio
async def test_recursive_chunker():
    """Test RecursiveChunker chunk size, overlap, and metadata tagger."""
    loader = DocumentLoader()
    doc = await loader.load_from_text(
        text="Paragraph 1 content.\n\nParagraph 2 with longer detailed research text. " * 30,
        title="LongDoc",
    )
    chunker = RecursiveChunker(chunk_size=500, chunk_overlap=100)
    chunks = chunker.create_chunks(doc)

    assert len(chunks) > 1
    assert chunks[0].document_id == doc.document_id
    assert "chunk_id" in chunks[0].metadata
    assert chunks[0].source == "LongDoc"
    assert len(chunks[0].content) <= 600


@pytest.mark.asyncio
async def test_embedding_service():
    """Test EmbeddingService async batch embedding generation."""
    settings = get_settings()
    service = EmbeddingService(settings=settings)
    texts = ["Quantum computing", "CRISPR gene editing"]
    embeddings = await service.generate_embeddings(texts)

    assert len(embeddings) == 2
    assert len(embeddings[0]) == service.dimension
    assert isinstance(embeddings[0][0], float)


@pytest.mark.asyncio
async def test_vector_db_and_retriever():
    """Test VectorDatabaseService insert and SemanticRetriever top-k similarity search."""
    settings = get_settings()
    embed_service = EmbeddingService(settings=settings)
    vectordb = VectorDatabaseService(settings=settings, collection_name="test_collection")
    retriever = SemanticRetriever(embedding_service=embed_service, vectordb_service=vectordb)

    loader = DocumentLoader()
    doc = await loader.load_from_text(
        text="Quantum error correction uses surface codes to achieve fault tolerance.",
        title="QuantumDoc",
    )
    chunker = RecursiveChunker(chunk_size=1000, chunk_overlap=200)
    chunks = chunker.create_chunks(doc)
    embeddings = await embed_service.generate_embeddings([c.content for c in chunks])

    inserted = await vectordb.insert_chunks(chunks, embeddings)
    assert inserted is True

    # Retrieve
    retrieval_res = await retriever.retrieve(query="surface codes error correction", top_k=2)
    assert retrieval_res.total_retrieved >= 1
    assert "surface codes" in retrieval_res.results[0].chunk.content.lower()


@pytest.mark.asyncio
async def test_citation_manager():
    """Test CitationManager structured citation creation and JSON formatting."""
    manager = CitationManager()
    citation = manager.create_citation(
        document_name="Quantum Paper",
        url="https://arxiv.org/abs/2401.12345",
        page_number=2,
        excerpt="Fault tolerant quantum computing...",
        confidence_score=0.92,
    )

    assert citation.title == "Quantum Paper"
    assert citation.source_domain == "arxiv.org"
    assert citation.confidence_score == 0.92

    formatted = manager.format_citations_as_json([citation])
    assert formatted[0]["website"] == "arxiv.org"


@pytest.mark.asyncio
async def test_source_verifier():
    """Test SourceVerifier 5-dimension scoring and confidence threshold."""
    verifier = SourceVerifier()
    response = verifier.verify_source(
        url="https://mit.edu/research/paper",
        content_sample="Statistical empirical evidence shows a 95% confidence interval across 500 samples et al.",
        published_date="2025-06-10",
    )

    assert response.domain == "mit.edu"
    assert response.authority_score >= 0.85
    assert response.overall_confidence_score > 0.75


@pytest.mark.asyncio
async def test_contradiction_detector():
    """Test ContradictionDetector contrast marker and numerical discrepancy detection."""
    detector = ContradictionDetector()
    texts = [
        "Study A reports an overall efficiency metric of 92% across all trials.",
        "Study B reports an overall efficiency metric of 45% under identical conditions, refuting Study A.",
    ]
    response = detector.detect_contradictions(topic="Efficiency Metric", evidence_texts=texts)

    assert response.contradictions_found is True
    assert len(response.claims) >= 1
    assert response.claims[0].confidence_level > 0.70


# ---------------------------------------------------------------------------
# API Endpoint Tests
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_api_research_health():
    """GET /api/research/health should return status healthy."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/research/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_api_research_search():
    """POST /api/research/search should return search results."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/research/search",
            json={"query": "quantum error correction", "max_results": 3},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["query"] == "quantum error correction"
    assert len(data["results"]) > 0


@pytest.mark.asyncio
async def test_api_research_ingest():
    """POST /api/research/ingest should ingest text and return document_id."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/research/ingest",
            json={
                "text": "Quantum computing utilizes qubits for parallel processing.",
                "file_name": "qubits.txt",
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "document_id" in data
    assert data["num_chunks"] >= 1


@pytest.mark.asyncio
async def test_api_research_embed():
    """POST /api/research/embed should return batch embeddings."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/research/embed",
            json={"texts": ["Text snippet A", "Text snippet B"]},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["embeddings"]) == 2
    assert data["dimensions"] == 768


@pytest.mark.asyncio
async def test_api_research_retrieve():
    """POST /api/research/retrieve should return relevant chunks."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/research/retrieve",
            json={"query": "qubits parallel processing", "top_k": 2},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data


@pytest.mark.asyncio
async def test_api_research_citations():
    """GET /api/research/citations should return citations list."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/research/citations")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_api_research_sources():
    """GET /api/research/sources should return source verification response."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/api/research/sources",
            params={"url": "https://arxiv.org/abs/2401.12345"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["domain"] == "arxiv.org"
    assert data["overall_confidence_score"] > 0.0
