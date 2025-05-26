from config import get_settings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, sessionmaker
import os

env = get_settings()

# Database setup
database_url = env.DATABASE_URL
engine = create_async_engine(database_url, echo=True, future=True)  # echo=True para ver las consultas SQL 

async_session = sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)
