import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Fix case sensitivity - use uppercase to match Settings class
engine = create_async_engine(
    settings.DATABASE_URL,  # Changed from database_url to DATABASE_URL
    echo=False,            # Removed settings.db_echo which doesn't exist
    future=True,
    pool_pre_ping=True,
    # Critical for serverless - no pool!
    poolclass=None,  
    # Fast failure for connections
    connect_args={
        "connect_timeout": 5,
        "command_timeout": 5
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
