"""
Semantic Retriever Module

Takes a user query, generates query embeddings, retrieves Top-K relevant chunks
from the vector database, ranks results, and returns structured RetrievalResponse objects.
"""

from typing import Any
from urllib.parse import urlparse

from app.core.logging import get_logger
from app.research.embeddings.embedding_service import EmbeddingService
from app.research.vectordb.chroma_db import VectorDatabaseService
from app.schemas.research import Chunk, Citation, RetrievalResponse, RetrievedChunk

logger = get_logger(__name__)


class SemanticRetriever:
    """Semantic Retrieval Engine."""

    def __init__(
        self,
        embedding_service: EmbeddingService,
        vectordb_service: VectorDatabaseService,
    ) -> None:
        self.embedding_service = embedding_service
        self.vectordb_service = vectordb_service

    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        session_id: str | None = None,
        filter_metadata: dict[str, Any] | None = None,
    ) -> RetrievalResponse:
        """
        Retrieve and rank Top-K relevant chunks for a user query.

        Args:
            query: The user search query.
            top_k: Number of chunks to retrieve.
            session_id: Optional session filter.
            filter_metadata: Additional metadata filters.

        Returns:
            RetrievalResponse with structured RetrievedChunk items.
        """
        logger.info("Semantic retrieval started", query=query, top_k=top_k)

        # Step 1: Generate query embedding
        query_embedding = await self.embedding_service.generate_single_embedding(query)

        # Build metadata filter if session_id provided
        where_filter: dict[str, Any] = filter_metadata or {}
        if session_id:
            where_filter["session_id"] = session_id

        # Step 2: Vector DB similarity search
        raw_results = await self.vectordb_service.similarity_search(
            query_embedding=query_embedding,
            top_k=top_k,
            metadata_filter=where_filter if where_filter else None,
        )

        retrieved_chunks: list[RetrievedChunk] = []
        for res in raw_results:
            source_url = res.get("source", "https://example.com/source")
            try:
                domain = urlparse(source_url).netloc or "example.com"
            except ValueError:
                domain = "example.com"

            chunk_obj = Chunk(
                chunk_id=res["chunk_id"],
                document_id=res.get("document_id", "doc_unknown"),
                content=res["content"],
                page_number=res.get("page_number", 1),
                source=source_url,
                metadata=res.get("metadata", {}),
            )

            citation_obj = Citation(
                title=f"Source: {domain}",
                url=source_url if source_url.startswith("http") else f"https://{source_url}",
                source_domain=domain,
                page_number=res.get("page_number", 1),
                confidence_score=res["score"],
                excerpt=res["content"][:200] + "...",
            )

            retrieved_chunks.append(
                RetrievedChunk(
                    chunk=chunk_obj,
                    similarity_score=res["score"],
                    source=source_url,
                    citation=citation_obj,
                )
            )

        logger.info("Semantic retrieval complete", retrieved_count=len(retrieved_chunks))

        return RetrievalResponse(
            query=query,
            results=retrieved_chunks,
            total_retrieved=len(retrieved_chunks),
        )
