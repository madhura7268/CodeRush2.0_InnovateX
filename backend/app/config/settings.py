"""
Configuration Management — Pydantic Settings

All configuration is loaded from environment variables.
Default values are provided for local development.

Usage:
    from app.config.settings import get_settings
    settings = get_settings()
    print(settings.DATABASE_URL)

Adding a new configuration value:
    1. Add it as a field to Settings with type annotation
    2. Add the corresponding variable to .env.example
    3. Document it in docs/development-guide.md
"""

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    All fields have defaults suitable for local development.
    In production, all secrets MUST be overridden via environment variables.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignore unexpected env vars
    )

    # --- Application ---
    APP_NAME: str = "Self-Evolving Autonomous Research Agent"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = Field(default="development", pattern="^(development|staging|production)$")
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # --- Backend ---
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # --- PostgreSQL ---
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "research_agent"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/research_agent"

    # --- ChromaDB ---
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_COLLECTION_NAME: str = "research_embeddings"

    # --- LLM Provider ---
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "openai"
    DEFAULT_LLM_MODEL: str = "gpt-4o"

    # --- Tavily Search ---
    TAVILY_API_KEY: str = ""

    # --- Sandbox ---
    SANDBOX_IMAGE: str = "python:3.11-slim"
    SANDBOX_TIMEOUT_SECONDS: int = 30
    SANDBOX_MEMORY_LIMIT: str = "256m"
    SANDBOX_CPU_QUOTA: int = 50000

    # --- Research Agent Knobs ---
    MAX_RESEARCH_ITERATIONS: int = 5
    MAX_CONCURRENT_RESEARCH_TASKS: int = 3
    RESEARCH_TIMEOUT_SECONDS: int = 300
    PLANNER_MAX_STEPS: int = 10
    GOVERNANCE_STRICT_MODE: bool = True
    EVALUATION_CONFIDENCE_THRESHOLD: float = 0.75

    # --- WebSocket ---
    WS_HEARTBEAT_INTERVAL_SECONDS: int = 30
    WS_MAX_CONNECTIONS: int = 100

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        """Allow ALLOWED_ORIGINS to be a comma-separated string in .env."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Returns a cached singleton Settings instance.

    Using lru_cache ensures we only parse environment variables once.
    In tests, clear the cache with get_settings.cache_clear() before
    overriding environment variables.
    """
    return Settings()
