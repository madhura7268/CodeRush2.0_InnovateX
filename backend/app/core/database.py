"""
Database Engine & Async Session Configuration

Provides SQLAlchemy async engine, sessionmaker, and Base metadata.
Supports PostgreSQL (asyncpg) with SQLite fallback for local development.
"""

from collections.abc import AsyncGenerator
import os

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, declarative_base

from app.config.settings import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

# Base class for SQLAlchemy declarative models
class Base(DeclarativeBase):
    pass

# Create engine dynamically based on DATABASE_URL
def get_engine() -> AsyncEngine:
    db_url = settings.DATABASE_URL
    # Ensure correct async driver scheme
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("sqlite://"):
        db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

    connect_args = {}
    if "sqlite" in db_url:
        connect_args["check_same_thread"] = False

    return create_async_engine(
        db_url,
        echo=settings.DEBUG and not settings.is_production,
        connect_args=connect_args,
    )

engine = get_engine()
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Initialize database tables during application startup."""
    global engine, async_session_factory
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        # Test active connection health
        async with async_session_factory() as session:
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
        logger.info("PostgreSQL database tables initialized and verified successfully")
    except Exception as e:
        logger.warning(
            "Primary PostgreSQL connection failed. Initializing SQLite fallback database.",
            error=str(e),
        )
        # Fallback to local SQLite database if Postgres is not reachable or auth fails
        fallback_url = "sqlite+aiosqlite:///./research_agent.db"
        engine = create_async_engine(fallback_url, connect_args={"check_same_thread": False})
        async_session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("SQLite fallback database initialized successfully")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields a database session per request."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
