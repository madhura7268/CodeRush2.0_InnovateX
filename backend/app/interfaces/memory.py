"""
Interface: IMemory

Defines the contract for the Memory & RAG module.

The Memory module provides the agent with both short-term (session)
and long-term (persistent) memory. It uses ChromaDB for vector
similarity search to power Retrieval-Augmented Generation (RAG).

Memory types:
    - SHORT_TERM: Current session state, recent tool outputs
    - LONG_TERM: Persistent knowledge base, past research findings
    - EPISODIC: Step-by-step record of agent actions

Implementing this module:
    - File: backend/app/memory/memory.py
    - ChromaDB: chromadb.Client() for vector storage
    - Embeddings: OpenAI or sentence-transformers
    - Register in backend/app/core/dependencies.py
"""

from abc import ABC, abstractmethod
from typing import Any


class IMemory(ABC):
    """Abstract interface for the Memory and RAG module."""

    @abstractmethod
    async def store(
        self,
        content: str,
        metadata: dict[str, Any],
        session_id: str,
        memory_type: str = "long_term",
    ) -> str:
        """
        Store a piece of information in memory.

        Generates an embedding for `content` and stores it in ChromaDB
        along with structured metadata for filtering.

        Args:
            content: The text content to store (e.g., search result, finding).
            metadata: Structured metadata (source URL, timestamp, step_id, etc.).
            session_id: The associated research session.
            memory_type: "short_term" or "long_term".

        Returns:
            document_id: The unique ID of the stored document.
        """
        ...

    @abstractmethod
    async def retrieve(
        self,
        query: str,
        session_id: str | None = None,
        top_k: int = 5,
        memory_type: str = "long_term",
    ) -> list[dict[str, Any]]:
        """
        Retrieve the most relevant documents for a query using vector similarity.

        Args:
            query: The search query (will be embedded and compared).
            session_id: If provided, restrict search to this session.
            top_k: Number of most relevant documents to return.
            memory_type: Which memory store to search.

        Returns:
            List of dicts with 'content', 'metadata', 'score', and 'id'.
        """
        ...

    @abstractmethod
    async def get_session_context(self, session_id: str) -> dict[str, Any]:
        """
        Retrieve the full short-term context for a research session.

        Returns the agent's working memory: recent tool outputs, current plan
        state, and intermediate findings — ready to inject into LLM prompts.

        Args:
            session_id: The session to retrieve context for.

        Returns:
            Dict with session state, recent findings, and tool call history.
        """
        ...

    @abstractmethod
    async def clear_session_memory(self, session_id: str) -> None:
        """
        Clear all short-term memory for a completed or cancelled session.

        Args:
            session_id: The session to clear.
        """
        ...

    @abstractmethod
    async def update_session_state(
        self, session_id: str, state_update: dict[str, Any]
    ) -> None:
        """
        Update the current session state (short-term memory).

        Args:
            session_id: The session to update.
            state_update: Key-value pairs to merge into the session state.
        """
        ...
