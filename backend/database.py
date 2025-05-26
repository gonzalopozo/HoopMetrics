import logging
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Global engine for serverless compatibility

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

engine = get_engine()  # Add this to fix import errors

# This factory creates sessions tied to the current event loop
def get_session_factory():
    engine = get_engine()
    return sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Initialize the session factory (don't leave it as None)
async_session_factory = get_session_factory()

# For dependency injection
async def get_db():
    session = async_session_factory()
    try:
        yield session
    finally:
        await session.close()
