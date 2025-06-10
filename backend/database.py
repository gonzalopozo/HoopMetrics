import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

def get_engine():
    return create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True,
        pool_pre_ping=True,
        # Configuración optimizada para web
        pool_size=5,  # Permitir más conexiones concurrentes
        max_overflow=10,
        pool_recycle=5,  # Reciclar conexiones después de 5 segundos
        pool_timeout=5,  # Timeout para obtener una conexión del pool
        connect_args={"timeout": 5.0}
    )

def get_session_factory():
    engine = get_engine()
    return sessionmaker(
        engine, 
        class_=AsyncSession, 
        expire_on_commit=False
    )

# Dependency para FastAPI
async def get_db():
    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session
