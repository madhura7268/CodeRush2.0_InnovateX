"""
Vector Database Module

Provides ChromaDB vector database wrapper supporting insert, update, delete,
similarity search, and metadata filtering. Includes an in-memory vector store
fallback to ensure operational reliability.
"""

import math
from typing import Any, Dict, List, Optional

from app.config.settings import Settings
from app.core.logging import get_logger
from app.schemas.research import Chunk

logger = get_logger(__name__)

try:
    import chromadb
except ImportError:
    chromadb = None


class VectorDatabaseService:
    """ChromaDB Vector Store implementation with metadata filtering & fallback."""

    def __init__(self, settings: Settings, collection_name: Optional[str] = None) -> None:
        self.settings = settings
        self.collection_name = collection_name or settings.CHROMA_COLLECTION_NAME
        self._chroma_client = None
        self._collection = None

        # Local in-memory fallback storage
        self._in_memory_chunks: Dict[str, Chunk] = {}
        self._in_memory_vectors: Dict[str, List[float]] = {}

        self._init_client()

    def _init_client(self) -> None:
        """Initialize ChromaDB client or set up fallback."""
        if chromadb:
            try:
                # Connect to ChromaDB server if running, or use persistent client
                self._chroma_client = chromadb.HttpClient(
                    host=self.settings.CHROMA_HOST,
                    port=self.settings.CHROMA_PORT,
                )
                self._collection = self._chroma_client.get_or_create_collection(
                    name=self.collection_name,
                    metadata={"hnsw:space": "cosine"},
                )
                logger.info("Connected to ChromaDB server", host=self.settings.CHROMA_HOST)
                return
            except Exception as e:
                logger.warning("Could not connect to ChromaDB server, using ephemeral client", error=str(e))
                try:
                    self._chroma_client = chromadb.Client()
                    self._collection = self._chroma_client.get_or_create_collection(
                        name=self.collection_name,
                        metadata={"hnsw:space": "cosine"},
                    )
                    return
                except Exception as ex:
                    logger.warning("Ephemeral ChromaDB client failed, using in-memory vector store", error=str(ex))

        logger.info("Using in-memory vector store fallback")

    async def insert_chunks(
        self,
        chunks: List[Chunk],
        embeddings: List[List[float]],
    ) -> bool:
        """Insert chunk objects and their embeddings into vector store."""
        if not chunks or not embeddings:
            return False

        logger.info("Inserting chunks into vector DB", count=len(chunks))

        if self._collection:
            try:
                ids = [c.chunk_id for c in chunks]
                documents = [c.content for c in chunks]
                metadatas = [
                    {
                        "document_id": c.document_id,
                        "source": c.source,
                        "page_number": c.page_number,
                        "timestamp": c.timestamp.isoformat(),
                        **{k: str(v) for k, v in c.metadata.items() if isinstance(v, (str, int, float, bool))},
                    }
                    for c in chunks
                ]

                self._collection.upsert(
                    ids=ids,
                    embeddings=embeddings,
                    documents=documents,
                    metadatas=metadatas,
                )
                logger.info("Chunks inserted into ChromaDB successfully")
                return True
            except Exception as e:
                logger.warning("ChromaDB insert failed, falling back to in-memory store", error=str(e))

        # Fallback in-memory storage
        for chunk, emb in zip(chunks, embeddings):
            self._in_memory_chunks[chunk.chunk_id] = chunk
            self._in_memory_vectors[chunk.chunk_id] = emb

        return True

    async def update_chunk(self, chunk: Chunk, embedding: List[float]) -> bool:
        """Update an existing chunk in the vector store."""
        return await self.insert_chunks([chunk], [embedding])

    async def delete_chunk(self, chunk_id: str) -> bool:
        """Delete a chunk by ID from the vector store."""
        logger.info("Deleting chunk from vector DB", chunk_id=chunk_id)
        if self._collection:
            try:
                self._collection.delete(ids=[chunk_id])
                return True
            except Exception as e:
                logger.warning("ChromaDB delete failed", error=str(e))

        self._in_memory_chunks.pop(chunk_id, None)
        self._in_memory_vectors.pop(chunk_id, None)
        return True

    async def similarity_search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        metadata_filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Perform similarity search using query embedding vector.

        Returns list of dicts with keys: chunk_id, content, score, metadata, source.
        """
        logger.info("Vector similarity search requested", top_k=top_k)

        if self._collection:
            try:
                where_filter = metadata_filter if metadata_filter else None
                results = self._collection.query(
                    query_embeddings=[query_embedding],
                    n_results=top_k,
                    where=where_filter,
                )

                output: List[Dict[str, Any]] = []
                ids = results.get("ids", [[]])[0]
                documents = results.get("documents", [[]])[0]
                metadatas = results.get("metadatas", [[]])[0]
                distances = results.get("distances", [[]])[0]

                for idx, cid in enumerate(ids):
                    # Convert distance to similarity score (0.0 to 1.0)
                    dist = distances[idx] if idx < len(distances) else 0.5
                    score = round(max(0.0, min(1.0, 1.0 - dist)), 4)
                    meta = metadatas[idx] if idx < len(metadatas) else {}

                    output.append(
                        {
                            "chunk_id": cid,
                            "content": documents[idx] if idx < len(documents) else "",
                            "score": score,
                            "metadata": meta,
                            "source": meta.get("source", "Unknown"),
                            "page_number": int(meta.get("page_number", 1)),
                            "document_id": meta.get("document_id", "unknown"),
                        }
                    )
                return output
            except Exception as e:
                logger.warning("ChromaDB search failed, using in-memory similarity search", error=str(e))

        # In-memory cosine similarity search
        return self._in_memory_cosine_search(query_embedding, top_k, metadata_filter)

    def _in_memory_cosine_search(
        self,
        query_vec: List[float],
        top_k: int,
        filter_meta: Optional[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Compute cosine similarity over in-memory vector store."""
        scored: List[tuple] = []
        q_norm = math.sqrt(sum(x * x for x in query_vec)) or 1.0

        for cid, vec in self._in_memory_vectors.items():
            chunk = self._in_memory_chunks.get(cid)
            if not chunk:
                continue

            # Apply metadata filters if provided
            if filter_meta:
                match = True
                for k, v in filter_meta.items():
                    if chunk.metadata.get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            # Calculate cosine similarity
            dot = sum(a * b for a, b in zip(query_vec, vec))
            v_norm = math.sqrt(sum(y * y for y in vec)) or 1.0
            sim = max(0.0, min(1.0, (dot / (q_norm * v_norm) + 1.0) / 2.0))

            scored.append((sim, chunk))

        # Sort by similarity score descending
        scored.sort(key=lambda x: x[0], reverse=True)

        results: List[Dict[str, Any]] = []
        for sim_score, chunk in scored[:top_k]:
            results.append(
                {
                    "chunk_id": chunk.chunk_id,
                    "content": chunk.content,
                    "score": round(sim_score, 4),
                    "metadata": chunk.metadata,
                    "source": chunk.source,
                    "page_number": chunk.page_number,
                    "document_id": chunk.document_id,
                }
            )
        return results
