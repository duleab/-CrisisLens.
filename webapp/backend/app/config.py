from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    google_api_key: str = Field(default="", alias="GOOGLE_API_KEY")
    deep_model: str = Field(default="gemini-2.0-flash-lite", alias="CRISISLENS_DEEP_MODEL")
    fast_model: str = Field(default="gemini-2.0-flash-lite", alias="CRISISLENS_FAST_MODEL")

    database_url: str = Field(
        default="postgresql+asyncpg://crisislens:changeme@localhost:5432/crisislens",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")
    newsapi_key: str = Field(default="", alias="NEWSAPI_KEY")

    # How often the background ingestion job runs, in minutes
    ingest_interval_minutes: int = Field(default=15, alias="INGEST_INTERVAL_MINUTES")

    region_bbox: dict = {
        "name": "Southeast Asia",
        "min_lat": -11.0, "max_lat": 21.0,
        "min_lon": 92.0, "max_lon": 141.0,
    }


settings = Settings()
