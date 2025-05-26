import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Create a properly configured engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    # Configure pool for concurrent requests
    pool_size=20,              # Maximum number of connections to keep persistently
    max_overflow=30,           # Maximum number of connections to create above pool_size
    pool_timeout=30,           # Seconds to wait before timing out on getting a connection
    pool_recycle=1800,         # Recycle connections after 30 minutes
    connect_args={
        "timeout": 10.0,
        "command_timeout": 10.0  # Timeout for queries
    }
)

def get_engine():
    """Get a database engine for the current event loop"""
    return engine

# Create session factory with explicit connection management
async_session_factory = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    autoflush=False  # Reduce chance of errors
)

# For dependency injection
async def get_db():
    session = async_session_factory()
    try:
        yield session
    except Exception as e:
        logger.error(f"Database session error: {e}")
        await session.rollback()
        raise
    finally:
        await session.close()
