import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "CrisisLens AI Platform"
    VERSION: str = "2.0.0"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3001", "*"]
    
    # Database
    DATABASE_URL: str = "sqlite:///./crisislens.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # External APIs
    GOOGLE_API_KEY: str = ""
    NEWSAPI_KEY: str = ""
    TELEGRAM_BOT_TOKEN: str = ""
    
    # AI Models
    GEMMA_MODEL: str = "gemma-4-31b-it"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # Processing
    COLLECTION_INTERVAL: int = 300  # 5 minutes
    MAX_EVENTS_PER_COLLECTION: int = 1000
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"

settings = Settings()