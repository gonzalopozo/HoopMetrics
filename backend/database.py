import logging
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Don't create engine at module level
_engine = None
_session_factory = None

def get_engine():
    """Get a database engine tied to the current event loop"""
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            future=True,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            pool_recycle=300,  # 5 minutes
            connect_args={"timeout": 5.0}
        )
    return _engine

def get_session_factory():
    """Get session factory tied to the current event loop"""
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            get_engine(), 
            class_=AsyncSession, 
            expire_on_commit=False,
            autoflush=False
        )
    return _session_factory

# Backwards compatibility
engine = get_engine()
async_session_factory = get_session_factory()

# For dependency injection
async def get_db():
    # Create a new session factory each time to ensure fresh connection
    factory = get_session_factory()
    session = factory()
    try:
        yield session
    finally:
        await session.close()
