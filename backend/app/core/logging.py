"""
Structured Logging Configuration

Uses structlog for structured, JSON-ready logging with contextual fields.
In development, logs are pretty-printed. In production, logs are emitted as JSON.

Usage:
    from app.core.logging import get_logger

    logger = get_logger(__name__)
    logger.info("Processing research", session_id=session_id, query=query)
    logger.error("Failed to run sandbox", error=str(e), session_id=session_id)
"""

import logging
import sys

import structlog


def configure_logging(log_level: str = "INFO") -> None:
    """
    Configure structlog and standard library logging.

    This should be called once at application startup (in main.py).
    All subsequent calls to get_logger() will use this configuration.
    """

    # Configure standard library logging to route into structlog
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper(), logging.INFO),
    )

    # Shared processors applied to every log record
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.ExceptionRenderer(),
    ]

    structlog.configure(
        processors=shared_processors
        + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Choose output format based on environment
    import os

    is_production = os.getenv("APP_ENV", "development") == "production"

    formatter = structlog.stdlib.ProcessorFormatter(
        # In production: JSON output for log aggregation tools (Datadog, CloudWatch, etc.)
        # In development: pretty, colorized console output
        processor=structlog.processors.JSONRenderer()
        if is_production
        else structlog.dev.ConsoleRenderer(),
        foreign_pre_chain=shared_processors,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers = [handler]
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """
    Returns a structlog BoundLogger instance.

    Args:
        name: Logger name, typically __name__ of the calling module.

    Returns:
        A structlog BoundLogger with the module name bound as context.
    """
    return structlog.get_logger(name)
