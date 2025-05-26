import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Fix connection parameters for asyncpg
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    # For serverless environments
    poolclass=None,
    # Use correct asyncpg parameters
    connect_args={
        "timeout": 5.0,  # Connection timeout in seconds
        "server_settings": {
            "statement_timeout": "5000"  # Query timeout in milliseconds
        }
    }
)

async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Create a fresh session each time
async def get_session():
    async with async_session_factory() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()
