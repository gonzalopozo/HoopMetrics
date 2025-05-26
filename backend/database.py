import logging
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# For backwards compatibility
def get_engine():
    """Create a fresh database engine for the current event loop"""
    return create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True,
        pool_pre_ping=True,
        # Critical for serverless - use minimal pooling
        pool_size=5,
        max_overflow=10,
        pool_recycle=60,  # Recycle connections frequently
        # Important: connect_args are passed directly to the underlying driver
        connect_args={"timeout": 5.0}
    )

# Create a fresh session factory for each request
def get_session_factory():
    """Create a session factory tied to the current event loop"""
    # Create a new engine for each session factory to avoid event loop issues
    engine = get_engine()
    return sessionmaker(
        engine, 
        class_=AsyncSession, 
        expire_on_commit=False
    )

# For dependency injection - critical for FastAPI endpoints
async def get_db():
    """Get a database session for the current request using the current event loop"""
    # Create a fresh session factory using the current event loop
    factory = get_session_factory()
    session = factory()
    try:
        yield session
    except Exception as e:
        logger.error(f"Database session error: {e}")
        await session.rollback()
        raise
    finally:
        await session.close()

# Compatibility variables for existing code
engine = get_engine()
async_session_factory = get_session_factory()
