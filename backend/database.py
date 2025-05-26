import logging
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Don't create a global engine - create it on demand
def get_engine():
    """Get a database engine for the current event loop"""
    return create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True,
        # Important for serverless: don't pool connections
        poolclass=None,
        connect_args={
            "timeout": 5.0
        }
    )

# This factory creates sessions tied to the current event loop
def get_session_factory():
    engine = get_engine()
    return sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Create a session factory when needed (not at import time)
async_session_factory = None

# For dependency injection
async def get_db():
    global async_session_factory
    if async_session_factory is None:
        async_session_factory = get_session_factory()
    
    session = async_session_factory()
    try:
        yield session
    finally:
        await session.close()
