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


class RealWebSearchProvider(ISearchProvider):
    """
    Live web search provider using DuckDuckGo HTML & Wikipedia APIs.
    Returns authentic web results with real titles, URLs, domains, and extracted snippets.
    """

    async def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "basic",
        include_domains: list[str] | None = None,
        exclude_domains: list[str] | None = None,
    ) -> list[SearchResult]:
        import re
        import html
        from urllib.parse import quote, unquote, urlparse

        logger.info("Executing RealWebSearchProvider search", query=query)
        results: list[SearchResult] = []
        seen_urls: set[str] = set()

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=8.0) as client:
            # 1. DuckDuckGo HTML Search
            try:
                resp = await client.post("https://html.duckduckgo.com/html/", data={"q": query})
                raw_html = resp.text
                link_matches = re.findall(r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>', raw_html)
                snippet_matches = re.findall(r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>', raw_html)

                for i, (raw_url, title_raw) in enumerate(link_matches):
                    if len(results) >= max_results:
                        break
                    title = html.unescape(re.sub(r'<[^<]+?>', '', title_raw)).strip()
                    if 'uddg=' in raw_url:
                        m = re.search(r'uddg=([^&]+)', raw_url)
                        real_url = unquote(m.group(1)) if m else raw_url
                    else:
                        real_url = raw_url

                    if real_url in seen_urls:
                        continue

                    snippet = ""
                    if i < len(snippet_matches):
                        snippet = html.unescape(re.sub(r'<[^<]+?>', '', snippet_matches[i])).strip()

                    domain = urlparse(real_url).netloc
                    if real_url.startswith("http") and domain and "duckduckgo" not in domain:
                        seen_urls.add(real_url)
                        results.append(
                            SearchResult(
                                title=title,
                                url=real_url,
                                content=snippet or f"Extracted web evidence for research query: {query}",
                                relevance_score=round(0.95 - (len(results) * 0.04), 2),
                                source_domain=domain,
                            )
                        )
            except Exception as e:
                logger.warning("DuckDuckGo search failed in RealWebSearchProvider", error=str(e))

            # 2. Wikipedia Search API (Augmentation / Fallback)
            if len(results) < max_results:
                try:
                    wiki_url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={quote(query)}&utf8=&format=json"
                    resp = await client.get(wiki_url)
                    data = resp.json()
                    for item in data.get("query", {}).get("search", []):
                        if len(results) >= max_results:
                            break
                        title = item["title"]
                        snippet = html.unescape(re.sub(r'<[^<]+?>', '', item["snippet"])).strip()
                        url = f"https://en.wikipedia.org/wiki/{quote(title.replace(' ', '_'))}"
                        if url in seen_urls:
                            continue
                        seen_urls.add(url)
                        results.append(
                            SearchResult(
                                title=title,
                                url=url,
                                content=snippet,
                                relevance_score=0.90,
                                source_domain="en.wikipedia.org",
                            )
                        )
                except Exception as e:
                    logger.warning("Wikipedia API search failed in RealWebSearchProvider", error=str(e))

        return results


class SearchService:
    """
    Search Service Manager.
    Uses TavilySearchProvider if API key exists, falling back to RealWebSearchProvider.
    """

    def __init__(self, settings: Settings, provider: ISearchProvider | None = None) -> None:
        self.settings = settings
        if provider:
            self.provider = provider
        elif settings.TAVILY_API_KEY:
            self.provider = TavilySearchProvider(api_key=settings.TAVILY_API_KEY)
        else:
            self.provider = RealWebSearchProvider()
        self.fallback_provider = RealWebSearchProvider()

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
            if not results:
                results = await self.fallback_provider.search(
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
