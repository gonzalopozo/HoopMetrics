from config import get_settings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, sessionmaker
import os

env = get_settings()

# Database setup
database_url = env.DATABASE_URL
engine = create_async_engine(
    database_url,
    echo=env.db_echo,
    future=True,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Create session factory
async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def async_session():
    # This ensures we get a fresh session tied to the current event loop
    session = async_session_factory()
    try:
        yield session
    finally:
        await session.close()
