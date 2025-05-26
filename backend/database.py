import logging
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Don't create a global engine or session factory - create them dynamically
def create_engine():
    """Create a fresh database engine for the current event loop."""
    return create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True,
        pool_pre_ping=True,
        # Serverless-optimized settings
        pool_size=1,
        max_overflow=0,
        pool_recycle=60,
        connect_args={"timeout": 5.0}
    )

def get_session_factory():
    """Create a new session factory tied to the current event loop."""
    engine = create_engine()
    return sessionmaker(
        engine, 
        class_=AsyncSession, 
        expire_on_commit=False
    )

# For dependency injection
async def get_db():
    """Provide a fresh database session for each request."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()

# For backward compatibility (some imports might still expect these)
engine = create_engine()
