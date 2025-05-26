from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from config import get_settings

settings = get_settings()

# Configure engine with parameters better suited for serverless
engine = create_async_engine(
    settings.database_url,
    echo=settings.db_echo,
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,  # Shorter recycle time for serverless
    pool_size=5,       # Smaller pool size
    max_overflow=10,   # Limit max connections
    connect_args={"connect_timeout": 10}  # Timeout faster
)

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
