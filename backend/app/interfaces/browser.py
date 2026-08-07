"""
Interface: IBrowserTool

Defines the contract for the Browser/Web Search tool.

The Browser Tool performs live web research on behalf of the agent.
It integrates with Tavily API to retrieve relevant web content,
extract text from pages, and return structured search results.

Implementing this module:
    - File: backend/app/browser/browser_tool.py
    - Tavily SDK: from tavily import TavilyClient
    - Register in backend/app/core/dependencies.py
"""

from abc import ABC, abstractmethod
from typing import List, Optional

from app.schemas.research import SearchResult


class IBrowserTool(ABC):
    """Abstract interface for web search and content retrieval."""

    @abstractmethod
    async def search(
        self,
        query: str,
        max_results: int = 10,
        search_depth: str = "basic",
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None,
    ) -> List[SearchResult]:
        """
        Perform a web search and return structured results.

        Args:
            query: The search query string.
            max_results: Maximum number of results to return.
            search_depth: "basic" for speed or "advanced" for deep research.
            include_domains: Restrict results to these domains.
            exclude_domains: Exclude results from these domains.

        Returns:
            List of SearchResult with title, url, content snippet, and relevance score.
        """
        ...

    @abstractmethod
    async def fetch_page(self, url: str) -> str:
        """
        Fetch and extract the text content of a web page.

        Args:
            url: The URL to fetch.

        Returns:
            Extracted text content of the page (cleaned, no HTML).
        """
        ...

    @abstractmethod
    async def search_and_extract(
        self, query: str, max_results: int = 5
    ) -> List[SearchResult]:
        """
        Perform a search and automatically fetch full content for each result.

        A convenience method combining search() and fetch_page().

        Args:
            query: The search query.
            max_results: Max results to retrieve and extract.

        Returns:
            List of SearchResult with full page content.
        """
        ...
