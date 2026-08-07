"""
Unified Research Pipeline Service

Integrates all 9 Research Pipeline sub-modules (Search, Load, Chunk, Embed,
VectorDB, Retrieve, Cite, Verify, Contradiction) into a cohesive service layer.
"""

from typing import Any

from app.config.settings import Settings
from app.core.logging import get_logger
from app.research.chunking.recursive_chunker import RecursiveChunker
from app.research.citation.citation_manager import CitationManager
from app.research.document_loader.document_loader import DocumentLoader
from app.research.embeddings.embedding_service import EmbeddingService
from app.research.evidence.contradiction_detector import ContradictionDetector
from app.research.retriever.semantic_retriever import SemanticRetriever
from app.research.search.search_service import SearchService
from app.research.vectordb.chroma_db import VectorDatabaseService
from app.research.verification.source_verifier import SourceVerifier
from app.schemas.research import (
    Citation,
    ContradictionResponse,
    IngestResponse,
    RetrievalResponse,
    SearchResponse,
    SourceVerificationResponse,
)

logger = get_logger(__name__)


class ResearchPipelineService:
    """Facade Service for the Research Pipeline."""

    def __init__(
        self,
        settings: Settings,
        search_service: SearchService | None = None,
        document_loader: DocumentLoader | None = None,
        chunker: RecursiveChunker | None = None,
        embedding_service: EmbeddingService | None = None,
        vectordb_service: VectorDatabaseService | None = None,
        retriever: SemanticRetriever | None = None,
        citation_manager: CitationManager | None = None,
        source_verifier: SourceVerifier | None = None,
        contradiction_detector: ContradictionDetector | None = None,
    ) -> None:
        self.settings = settings
        self.search_service = search_service or SearchService(settings=settings)
        self.document_loader = document_loader or DocumentLoader()
        self.chunker = chunker or RecursiveChunker(
            chunk_size=1000, chunk_overlap=200
        )
        self.embedding_service = embedding_service or EmbeddingService(settings=settings)
        self.vectordb_service = vectordb_service or VectorDatabaseService(settings=settings)
        self.retriever = retriever or SemanticRetriever(
            embedding_service=self.embedding_service,
            vectordb_service=self.vectordb_service,
        )
        self.citation_manager = citation_manager or CitationManager()
        self.source_verifier = source_verifier or SourceVerifier()
        self.contradiction_detector = contradiction_detector or ContradictionDetector()

        logger.info("ResearchPipelineService fully initialized with all 9 sub-services")

    async def execute_search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "basic",
        include_domains: list[str] | None = None,
        exclude_domains: list[str] | None = None,
    ) -> SearchResponse:
        """Execute web search using SearchService."""
        results = await self.search_service.search(
            query=query,
            max_results=max_results,
            search_depth=search_depth,
            include_domains=include_domains,
            exclude_domains=exclude_domains,
        )
        return SearchResponse(
            query=query,
            results=results,
            total_results=len(results),
            provider_used="tavily" if self.settings.TAVILY_API_KEY else "mock-fallback",
        )

    async def ingest_document(
        self,
        text: str | None = None,
        url: str | None = None,
        file_name: str = "document.txt",
        file_type: str = "txt",
        metadata: dict[str, Any] | None = None,
    ) -> IngestResponse:
        """Full pipeline: Load document → Chunk → Embed → Vector DB Insert."""
        logger.info("Ingesting document into research pipeline", file_name=file_name)

        # 1. Load document
        if text:
            doc = await self.document_loader.load_from_text(
                text=text, title=file_name, file_type=file_type, metadata=metadata
            )
            if url:
                doc.source_path_or_url = url
        elif url:
            # Simple HTTP fetch placeholder or HTML parse
            doc = await self.document_loader.load_from_html(
                html_content=f"<html><body><h1>Content from {url}</h1><p>Sample scraped text.</p></body></html>",
                title=file_name,
                url=url,
                metadata=metadata,
            )
        else:
            doc = await self.document_loader.load_from_text(
                text="Empty content document.", title=file_name, file_type="txt", metadata=metadata
            )

        # 2. Chunk document
        chunks = self.chunker.create_chunks(doc)

        # 3. Generate embeddings
        chunk_texts = [c.content for c in chunks]
        embeddings = await self.embedding_service.generate_embeddings(chunk_texts)

        # 4. Insert into Vector Database
        await self.vectordb_service.insert_chunks(chunks, embeddings)

        return IngestResponse(
            document_id=doc.document_id,
            num_chunks=len(chunks),
            status="ingested",
            message=f"Successfully processed, chunked into {len(chunks)} chunks, and stored in vector DB.",
        )

    async def generate_embeddings_batch(
        self, texts: list[str], provider: str | None = None
    ) -> tuple[list[list[float]], int, str]:
        """Generate embeddings for a list of texts."""
        embeddings = await self.embedding_service.generate_embeddings(texts)
        return (
            embeddings,
            self.embedding_service.dimension,
            self.embedding_service.provider_name,
        )

    async def retrieve_relevant_chunks(
        self,
        query: str,
        top_k: int = 5,
        session_id: str | None = None,
        filter_metadata: dict[str, Any] | None = None,
    ) -> RetrievalResponse:
        """Perform semantic search retrieval."""
        return await self.retriever.retrieve(
            query=query,
            top_k=top_k,
            session_id=session_id,
            filter_metadata=filter_metadata,
        )

    async def get_citations(self, session_id: str | None = None) -> list[Citation]:
        """Generate structured citations from recent session results."""
        results = await self.retriever.retrieve(
            query="*", top_k=5, session_id=session_id
        )
        raw_items = [
            {
                "title": r.citation.title,
                "url": r.citation.url,
                "page_number": r.citation.page_number,
                "excerpt": r.chunk.content,
                "score": r.similarity_score,
            }
            for r in results.results
        ]
        return self.citation_manager.generate_citations_from_results(raw_items)

    async def verify_source(
        self,
        url: str,
        domain: str | None = None,
        content_sample: str | None = None,
        published_date: str | None = None,
    ) -> SourceVerificationResponse:
        """Verify source reliability across 5 quality dimensions."""
        return self.source_verifier.verify_source(
            url=url,
            domain=domain,
            content_sample=content_sample,
            published_date=published_date,
        )

    async def detect_contradictions(
        self, topic: str, evidence_texts: list[str]
    ) -> ContradictionResponse:
        """Detect conflicting claims across evidence sources."""
        return self.contradiction_detector.detect_contradictions(
            topic=topic, evidence_texts=evidence_texts
        )
