import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

def get_engine():
    """Create a new database engine tied to the current event loop."""
    return create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True,
        pool_pre_ping=True,
        pool_size=5,  # Adjust pool size for serverless
        max_overflow=10,
        connect_args={"timeout": 5.0}
    )

def get_session_factory():
    """Create a new session factory tied to the current event loop."""
    engine = get_engine()
    return sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    """Dependency to provide a database session for each request."""
    session_factory = get_session_factory()
    session = session_factory()
    try:
        yield session
    finally:
        await session.close()
