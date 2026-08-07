"""
Citation Manager Module

Generates structured citations containing document name, URL, website domain,
page number, retrieval timestamp, and confidence score.
Serializes citations to JSON.
"""

from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from app.core.logging import get_logger
from app.schemas.research import Citation

logger = get_logger(__name__)


class CitationManager:
    """Citation Generation & Formatting Service."""

    def create_citation(
        self,
        document_name: str,
        url: str,
        page_number: int | None = 1,
        excerpt: str | None = None,
        confidence_score: float = 0.85,
    ) -> Citation:
        """Create a single structured Citation object."""
        domain = urlparse(url).netloc or "local_source"
        if not url.startswith(("http://", "https://", "file://")):
            url = f"https://{url}" if domain != "local_source" else f"file:///{url}"

        return Citation(
            title=document_name,
            url=url,
            source_domain=domain,
            page_number=page_number,
            excerpt=excerpt[:300] if excerpt else None,
            confidence_score=round(confidence_score, 4),
            accessed_at=datetime.now(timezone.utc),
        )

    def generate_citations_from_results(
        self,
        results: list[dict[str, Any]],
    ) -> list[Citation]:
        """Convert a batch of raw search/retrieval result dicts into Citation objects."""
        logger.info("Generating citations", result_count=len(results))
        citations: list[Citation] = []

        for item in results:
            doc_name = item.get("title") or item.get("document_name") or item.get("source", "Untitled Source")
            url = item.get("url") or item.get("source", "https://example.com")
            page_num = item.get("page_number", 1)
            excerpt = item.get("content") or item.get("excerpt")
            score = float(item.get("score") or item.get("confidence_score") or item.get("relevance_score", 0.85))

            citation = self.create_citation(
                document_name=doc_name,
                url=url,
                page_number=page_num,
                excerpt=excerpt,
                confidence_score=score,
            )
            citations.append(citation)

        return citations

    def format_citations_as_json(self, citations: list[Citation]) -> list[dict[str, Any]]:
        """Serialize a list of Citation objects to JSON-serializable dictionaries."""
        return [
            {
                "title": c.title,
                "url": c.url,
                "website": c.source_domain,
                "page_number": c.page_number,
                "retrieval_timestamp": c.accessed_at.isoformat(),
                "confidence_score": c.confidence_score,
                "excerpt": c.excerpt,
            }
            for c in citations
        ]
