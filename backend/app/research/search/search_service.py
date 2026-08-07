"""
Search Service

Modular web search abstraction supporting Tavily Search API as primary provider
with automatic mock/fallback when API keys are unconfigured or requests fail.
"""

from abc import ABC, abstractmethod
from urllib.parse import urlparse

import httpx

from app.config.settings import Settings
from app.core.logging import get_logger
from app.schemas.research import SearchResult

logger = get_logger(__name__)


class ISearchProvider(ABC):
    """Abstract search provider contract for easily swapping providers."""

    @abstractmethod
    async def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "basic",
        include_domains: list[str] | None = None,
        exclude_domains: list[str] | None = None,
    ) -> list[SearchResult]:
        """Perform search and return list of SearchResult objects."""
        ...


class TavilySearchProvider(ISearchProvider):
    """Primary search provider using Tavily REST API."""

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.endpoint = "https://api.tavily.com/search"

    async def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "basic",
        include_domains: list[str] | None = None,
        exclude_domains: list[str] | None = None,
    ) -> list[SearchResult]:
        if not self.api_key:
            raise ValueError("Tavily API key is empty.")

        payload = {
            "api_key": self.api_key,
            "query": query,
            "max_results": max_results,
            "search_depth": search_depth,
            "include_domains": include_domains or [],
            "exclude_domains": exclude_domains or [],
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(self.endpoint, json=payload)
            resp.raise_for_status()
            data = resp.json()

        results: list[SearchResult] = []
        for item in data.get("results", []):
            url = item.get("url", "")
            domain = urlparse(url).netloc or "unknown"
            results.append(
                SearchResult(
                    title=item.get("title", "Untitled"),
                    url=url,
                    content=item.get("content", ""),
                    relevance_score=float(item.get("score", 0.8)),
                    source_domain=domain,
                    published_date=item.get("published_date"),
                )
            )
        return results


class MockSearchProvider(ISearchProvider):
    """Fallback search provider generating structured mock search results."""

    async def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "basic",
        include_domains: list[str] | None = None,
        exclude_domains: list[str] | None = None,
    ) -> list[SearchResult]:
        logger.info("Using MockSearchProvider", query=query)
        mock_domains = ["arxiv.org", "nature.com", "sciencedirect.com", "mit.edu", "stanford.edu"]
        results: list[SearchResult] = []
        for i in range(1, min(max_results, 5) + 1):
            domain = mock_domains[(i - 1) % len(mock_domains)]
            results.append(
                SearchResult(
                    title=f"Research Insights #{i}: {query.capitalize()}",
                    url=f"https://{domain}/article/research-{i}",
                    content=f"Comprehensive findings and analysis regarding {query}. "
                            f"Section {i} explores empirical evidence, methodology, and key discoveries.",
                    relevance_score=round(0.95 - (i * 0.05), 2),
                    source_domain=domain,
                    published_date="2026-01-15",
                )
            )
        return results


class SearchService:
    """
    Search Service Manager.

    Uses TavilySearchProvider if API key exists, gracefully falling back
    to MockSearchProvider on configuration or request errors.
    """

    def __init__(self, settings: Settings, provider: ISearchProvider | None = None) -> None:
        self.settings = settings
        if provider:
            self.provider = provider
        elif settings.TAVILY_API_KEY:
            self.provider = TavilySearchProvider(api_key=settings.TAVILY_API_KEY)
        else:
            self.provider = MockSearchProvider()
        self.fallback_provider = MockSearchProvider()

    async def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "basic",
        include_domains: list[str] | None = None,
        exclude_domains: list[str] | None = None,
    ) -> list[SearchResult]:
        """Search query with automatic fallback error handling."""
        logger.info("Search requested", query=query, max_results=max_results)
        try:
            results = await self.provider.search(
                query=query,
                max_results=max_results,
                search_depth=search_depth,
                include_domains=include_domains,
                exclude_domains=exclude_domains,
            )
            logger.info("Search successful", results_count=len(results))
            return results
        except Exception as e:  # noqa: BLE001
            logger.warning("Primary search provider failed, using fallback", error=str(e))
            return await self.fallback_provider.search(
                query=query,
                max_results=max_results,
                search_depth=search_depth,
                include_domains=include_domains,
                exclude_domains=exclude_domains,
            )
