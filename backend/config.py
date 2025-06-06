from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache



class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    DATABASE_URL: str
    AUTH_SECRET_KEY: str
    AUTH_ALGORITHM: str
    AUTH_ACCESS_TOKEN_EXPIRE_MINUTES: int
    FRONTEND_URL: str
    SPACES_REGION: str
    SPACES_BUCKET: str
    SPACES_ACCESS_KEY: str
    SPACES_SECRET_KEY: str


# @lru_cache
def get_settings():
    return Settings()