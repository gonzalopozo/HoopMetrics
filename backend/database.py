import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool  # <-- Import NullPool
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Create the engine ONCE at import time, but with NullPool for serverless/short-lived connections
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    poolclass=NullPool,  # <-- Use NullPool to ensure a new connection per session
    connect_args={"timeout": 10.0}
)

SessionLocal = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Dependency for FastAPI
async def get_db():
    async with SessionLocal() as session:
        yield session
