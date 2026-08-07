"""
Shared utility functions for the Research Agent backend.
"""

import uuid
from datetime import datetime, timezone


def generate_id(prefix: str = "") -> str:
    """Generate a unique ID with an optional prefix."""
    uid = str(uuid.uuid4())
    return f"{prefix}-{uid}" if prefix else uid


def utcnow() -> datetime:
    """Return the current UTC timestamp."""
    return datetime.now(timezone.utc)


def truncate_text(text: str, max_length: int = 500) -> str:
    """Truncate text to a maximum length with ellipsis."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def calculate_confidence_average(scores: dict) -> float:
    """Calculate the weighted average confidence from dimension scores."""
    if not scores:
        return 0.0
    return sum(scores.values()) / len(scores)
