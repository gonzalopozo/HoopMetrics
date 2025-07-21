import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Create the engine ONCE at import time
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=1,           # For Neon/serverless: pool_size=1
    max_overflow=0,        # No overflow
    pool_recycle=1800,     # Optional: recycle every 30min
    pool_timeout=10,       # Optional: 10s timeout
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
