import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Create a shared engine at the module level
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=10,  # Adjust pool size for concurrency
    max_overflow=20,  # Allow extra connections during high load
    pool_recycle=300,  # Recycle connections every 5 minutes
    connect_args={"timeout": 5.0}
)

# Create a session factory using the shared engine
SessionFactory = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Dependency to provide a fresh session for each request
async def get_db():
    """Provide a fresh database session for each request."""
    async with SessionFactory() as session:
        try:
            yield session
        finally:
            await session.close()
