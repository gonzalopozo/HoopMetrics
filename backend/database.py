from .config import get_settings
from sqlmodel import create_engine, Session
from sqlmodel import SQLModel, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

env = get_settings()

# Database setup
database_url = env.DATABASE_URL
engine = create_async_engine(database_url, echo=True, future=True)  # echo=True para ver las consultas SQL 

async_session = sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

# Dependency to get DB session
# def get_session():
#     with Session(engine) as session:
#         yield session