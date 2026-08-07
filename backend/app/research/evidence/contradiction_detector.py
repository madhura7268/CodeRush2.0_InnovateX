"""
Contradiction Detection Module

Compares evidence texts across sources to identify conflicting claims,
differing numerical metrics, or opposing conclusions without discarding them.
"""

import re

from app.core.logging import get_logger
from app.schemas.research import ContradictionClaim, ContradictionResponse

logger = get_logger(__name__)

# Keywords indicating potential contradictions / contrast
CONTRAST_MARKERS = [
    "however", "on the contrary", "in contrast", "conversely",
    "disagrees", "conflicts", "unlike", "whereas", "opposed to",
    "differs from", "contradicts", "refutes",
]


class ContradictionDetector:
    """Contradiction & Evidence Conflict Detection Engine."""

    def detect_contradictions(
        self,
        topic: str,
        evidence_texts: list[str],
        sources: list[str] | None = None,
    ) -> ContradictionResponse:
        """
        Analyze a list of evidence texts for conflicting statements.

        Important: Conflicting evidence is preserved and reported, NOT discarded.
        """
        logger.info(
            "Detecting contradictions",
            topic=topic,
            evidence_count=len(evidence_texts),
        )

        sources_list = sources or [f"Source #{i + 1}" for i in range(len(evidence_texts))]
        claims: list[ContradictionClaim] = []

        # Compare pairs of evidence texts
        for i in range(len(evidence_texts)):
            for j in range(i + 1, len(evidence_texts)):
                text_a = evidence_texts[i]
                text_b = evidence_texts[j]
                src_a = sources_list[i] if i < len(sources_list) else f"Source #{i + 1}"
                src_b = sources_list[j] if j < len(sources_list) else f"Source #{j + 1}"

                conflict_found, claim_a, claim_b, exp, conf = self._compare_text_pair(
                    text_a, text_b
                )

                if conflict_found:
                    claims.append(
                        ContradictionClaim(
                            claim_a=claim_a,
                            claim_b=claim_b,
                            supporting_sources_a=[src_a],
                            supporting_sources_b=[src_b],
                            confidence_level=conf,
                            explanation=exp,
                        )
                    )

        found = len(claims) > 0
        summary = (
            f"Detected {len(claims)} potential contradiction(s) across {len(evidence_texts)} evidence sources for '{topic}'."
            if found
            else f"No major contradictions detected across {len(evidence_texts)} evidence sources for '{topic}'."
        )

        logger.info(
            "Contradiction detection complete",
            topic=topic,
            contradictions_found=found,
            claim_count=len(claims),
        )

        return ContradictionResponse(
            topic=topic,
            contradictions_found=found,
            claims=claims,
            summary=summary,
        )

    def _compare_text_pair(
        self, text_a: str, text_b: str
    ) -> tuple[bool, str, str, str, float]:
        """Compare two text snippets for semantic contrast or numerical discrepancy."""
        text_a_lower = text_a.lower()
        text_b_lower = text_b.lower()

        # Check 1: Explicit contrast markers present
        for marker in CONTRAST_MARKERS:
            if marker in text_a_lower or marker in text_b_lower:
                return (
                    True,
                    text_a[:150] + "...",
                    text_b[:150] + "...",
                    f"Contrast marker '{marker}' indicates opposing arguments or conclusions.",
                    0.80,
                )

        # Check 2: Discrepancy in numeric percentages / metrics
        pct_a = re.findall(r"(\d+(?:\.\d+)?)\s*%", text_a)
        pct_b = re.findall(r"(\d+(?:\.\d+)?)\s*%", text_b)
        if pct_a and pct_b and pct_a[0] != pct_b[0]:
            val_a = float(pct_a[0])
            val_b = float(pct_b[0])
            if abs(val_a - val_b) > 5.0:  # significant numerical delta
                return (
                    True,
                    f"Reports metric value of {val_a}%",
                    f"Reports metric value of {val_b}%",
                    f"Numerical discrepancy detected between sources ({val_a}% vs {val_b}%).",
                    0.88,
                )

        # Check 3: Simple negation check (is/is not, can/cannot)
        negations = [("increase", "decrease"), ("effective", "ineffective"), ("safe", "unsafe"), ("allowed", "forbidden")]
        for pos, neg in negations:
            if (pos in text_a_lower and neg in text_b_lower) or (neg in text_a_lower and pos in text_b_lower):
                return (
                    True,
                    text_a[:150] + "...",
                    text_b[:150] + "...",
                    f"Direct negation detected between terms '{pos}' and '{neg}'.",
                    0.85,
                )

        return False, "", "", "", 0.0
