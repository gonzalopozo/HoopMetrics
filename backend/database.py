import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool  # <-- Import NullPool
from .config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _database_connection_config(database_url: str) -> tuple[str, dict]:
    url = make_url(database_url)
    connect_args = {"timeout": 10.0}

    if url.drivername in {"postgres", "postgresql", "postgresql+psycopg2"}:
        url = url.set(drivername="postgresql+asyncpg")

    sslmode = url.query.get("sslmode")
    if sslmode is not None:
        connect_args["ssl"] = sslmode
        url = url.difference_update_query(["sslmode"])

    return url.render_as_string(hide_password=False), connect_args


database_url, connect_args = _database_connection_config(settings.DATABASE_URL)


# Create the engine ONCE at import time, but with NullPool for serverless/short-lived connections
engine = create_async_engine(
    database_url,
    echo=False,
    future=True,
    poolclass=NullPool,  # <-- Use NullPool to ensure a new connection per session
    connect_args=connect_args
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
