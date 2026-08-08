"""
Browser Tool — Placeholder Implementation

Implements: IBrowserTool

TODO: Implement using Tavily SDK:
    from tavily import TavilyClient

    client = TavilyClient(api_key=settings.TAVILY_API_KEY)
    results = client.search(query=query, max_results=max_results)
"""


from app.config.settings import Settings
from app.core.logging import get_logger
from app.interfaces.browser import IBrowserTool
from app.schemas.research import SearchResult
from app.research.search.search_service import SearchService

logger = get_logger(__name__)


class BrowserTool(IBrowserTool):
    """
    Browser tool providing web search capability via SearchService.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.search_service = SearchService(settings=settings)
        logger.info("BrowserTool initialized with SearchService")

    async def search(
        self,
        query: str,
        max_results: int = 10,
        search_depth: str = "basic",
        include_domains: list[str] | None = None,
        exclude_domains: list[str] | None = None,
    ) -> list[SearchResult]:
        """Perform real web search via SearchService."""
        logger.info("Web search requested in BrowserTool", query=query)
        return await self.search_service.search(
            query=query,
            max_results=max_results,
            search_depth=search_depth,
            include_domains=include_domains,
            exclude_domains=exclude_domains,
        )

    async def fetch_page(self, url: str) -> str:
        """Fetch page content via HTTP client."""
        logger.info("Page fetch requested", url=url)
        import httpx
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url)
                return resp.text[:5000]
        except Exception as e:
            return f"Content of page at {url} could not be extracted: {str(e)}"

    async def search_and_extract(
        self, query: str, max_results: int = 5
    ) -> list[SearchResult]:
        """Combine search + extract for deep research."""
        return await self.search(query, max_results=max_results)

