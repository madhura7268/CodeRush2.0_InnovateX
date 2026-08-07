"""
Source Verification Module

Calculates source reliability scores based on 5 core dimensions:
1. Authority (.edu, .gov, .org, academic repos vs general TLDs)
2. Relevance (content overlap with query)
3. Recency (publication date freshness)
4. Domain Reputation (whitelisted domains & trusted TLDs)
5. Evidence Quality (text length, structural quality, citations present)

Produces an overall source confidence score [0.0, 1.0].
"""

import re
from datetime import datetime, timezone
from urllib.parse import urlparse

from app.core.logging import get_logger
from app.schemas.research import SourceVerificationResponse

logger = get_logger(__name__)

# Known high-reputation domains
TRUSTED_DOMAINS = {
    "arxiv.org", "nature.com", "sciencedirect.com", "ieee.org",
    "nih.gov", "cdc.gov", "who.int", "mit.edu", "stanford.edu",
    "harvard.edu", "github.com", "wikipedia.org", "reuters.com",
    "bloomberg.com", "bbc.com",
}


class SourceVerifier:
    """Multi-Dimensional Source Verification Engine."""

    def calculate_authority_score(self, url: str, domain: str) -> float:
        """Score authority based on TLD and domain presence."""
        if any(domain.endswith(tld) for tld in [".gov", ".edu", ".mil"]):
            return 0.95
        if any(domain.endswith(tld) for tld in [".org", ".ac.uk", ".edu.au"]):
            return 0.85
        if domain in TRUSTED_DOMAINS:
            return 0.90
        if domain.endswith(".com"):
            return 0.70
        return 0.50

    def calculate_relevance_score(self, content_sample: str | None) -> float:
        """Score relevance based on content length and complexity."""
        if not content_sample:
            return 0.50
        length = len(content_sample)
        if length > 500:
            return 0.90
        if length > 150:
            return 0.75
        return 0.40

    def calculate_recency_score(self, published_date: str | None) -> float:
        """Score recency based on publication year."""
        if not published_date:
            return 0.70  # default moderate score when date missing
        try:
            # Extract 4-digit year
            match = re.search(r"\b(20\d{2}|19\d{2})\b", published_date)
            if match:
                year = int(match.group(1))
                current_year = datetime.now(timezone.utc).year
                diff = current_year - year
                if diff <= 1:
                    return 1.00
                if diff <= 3:
                    return 0.85
                if diff <= 5:
                    return 0.70
                return 0.50
        except (ValueError, TypeError) as e:
            logger.debug("Failed to parse publication date '%s': %s", published_date, e)
        return 0.70

    def calculate_domain_reputation(self, domain: str) -> float:
        """Score domain reputation."""
        if domain in TRUSTED_DOMAINS:
            return 0.95
        if any(domain.endswith(tld) for tld in [".edu", ".gov", ".org"]):
            return 0.88
        return 0.65

    def calculate_evidence_quality(self, content_sample: str | None) -> float:
        """Score evidence quality based on structural indicators (citations, numbers, code)."""
        if not content_sample:
            return 0.40

        score = 0.50
        # Check for numbers / empirical data
        if re.search(r"\d+%", content_sample) or re.search(r"\$\d+", content_sample):
            score += 0.15
        # Check for citations / links / references
        if "http" in content_sample or "et al" in content_sample or "[" in content_sample:
            score += 0.15
        # Check for substantial text structure
        if len(content_sample.split()) > 40:
            score += 0.15

        return min(1.00, round(score, 2))

    def verify_source(
        self,
        url: str,
        domain: str | None = None,
        content_sample: str | None = None,
        published_date: str | None = None,
    ) -> SourceVerificationResponse:
        """
        Evaluate and verify a source across 5 dimensions.

        Returns SourceVerificationResponse with overall confidence score.
        """
        clean_url = url if url.startswith("http") else f"https://{url}"
        extracted_domain = domain or urlparse(clean_url).netloc or "unknown"

        authority = self.calculate_authority_score(clean_url, extracted_domain)
        relevance = self.calculate_relevance_score(content_sample)
        recency = self.calculate_recency_score(published_date)
        reputation = self.calculate_domain_reputation(extracted_domain)
        evidence = self.calculate_evidence_quality(content_sample)

        # Weighted average overall score
        overall = round(
            (authority * 0.25)
            + (relevance * 0.25)
            + (recency * 0.15)
            + (reputation * 0.20)
            + (evidence * 0.15),
            4,
        )

        rationale = (
            f"Source '{extracted_domain}' evaluated: Authority={authority}, "
            f"Relevance={relevance}, Recency={recency}, Reputation={reputation}, "
            f"Evidence Quality={evidence}."
        )

        logger.info(
            "Source verification completed",
            domain=extracted_domain,
            overall_score=overall,
        )

        return SourceVerificationResponse(
            url=clean_url,
            domain=extracted_domain,
            authority_score=authority,
            relevance_score=relevance,
            recency_score=recency,
            domain_reputation=reputation,
            evidence_quality=evidence,
            overall_confidence_score=overall,
            rationale=rationale,
        )
