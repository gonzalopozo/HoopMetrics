from .config import get_settings
from sqlmodel import create_engine, Session

env = get_settings()

# Database setup
database_url = env.DATABASE_URL
engine = create_engine(database_url, echo=True)  # echo=True para ver las consultas SQL

# Dependency to get DB session
def get_session():
    with Session(engine) as session:
        yield session