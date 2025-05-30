import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from .config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Crear un único engine global con mejor configuración de pool
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    # Configuración optimizada para web
    pool_size=50,  # Permitir más conexiones concurrentes
    max_overflow=10,
    pool_recycle=5,  # Reciclar conexiones después de 5 segundos
    pool_timeout=5,  # Timeout para obtener una conexión del pool
    connect_args={"timeout": 5.0}
)

# Factory de sesiones global
SessionLocal = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Para dependency injection
async def get_db():
    """Provide a database session for each request."""
    session = SessionLocal()
    try:
        yield session
    finally:
        await session.close()

# Para el health check
def get_session_factory():
    """Mantener por compatibilidad"""
    return SessionLocal
