
from pydantic import model_validator
from pydantic_settings import BaseSettings
from typing import List, Union, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Blot Intelligence Engine"
    API_V1_STR: str = "/api/v1"
    
    # DATABASE
    # Supporting both DATABASE_URL (common in docker/envs) and the internal SQLALCHEMY_DATABASE_URI
    DATABASE_URL: str = "postgresql://user:password@hostname:5432/dbname"
    SQLALCHEMY_DATABASE_URI: str = "postgresql://user:password@hostname:5432/dbname"
    
    # AUTH
    SECRET_KEY: str = "placeholder_secret_key" # Should be in .env in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour (was 7 days)
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for refresh token

    # REDIS / CELERY
    REDIS_URL: str = "redis://hostname:6379/0"
    CELERY_BROKER_URL: str = "redis://hostname:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://hostname:6379/0"

    # OBSERVABILITY
    SENTRY_DSN: str = ""
    PROMETHEUS_METRICS_ENABLED: bool = True
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000", 
        "http://localhost:8000", 
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:8000",
        "http://localhost",
        "http://127.0.0.1"
    ] # React and localhost

    # External APIs
    GEMINI_API_KEY_1: str = ""
    GEMINI_API_KEY_2: str = ""
    GEMINI_API_KEY_3: str = ""
    GEMINI_API_KEY_4: str = ""
    GEMINI_API_KEY_5: str = ""
    GEMINI_API_KEY_6: str = ""

    STABLE_HORDE_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    TWITTER_CONSUMER_KEY: str = ""
    TWITTER_CONSUMER_SECRET: str = ""
    TWITTER_ACCESS_TOKEN: str = ""
    TWITTER_ACCESS_TOKEN_SECRET: str = ""

    FRONTEND_URL: str = "http://localhost:5173"
    STRIPE_API_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    class Config:
        case_sensitive = True
        env_file = ".env"
    @model_validator(mode="after")
    def assemble_db_and_redis(self) -> "Settings":
        """
        Ensures consistency between multiple environment variable formats.
        Specifically handles the case where only DATABASE_URL or REDIS_URL is provided locally.
        """
        # 1. Sync Database: If DATABASE_URL was overridden (contains 'localhost'), use it for the engine too
        if "localhost" in self.DATABASE_URL or "127.0.0.1" in self.DATABASE_URL:
            self.SQLALCHEMY_DATABASE_URI = self.DATABASE_URL
            
        # 2. Sync Redis: If REDIS_URL was overridden, ensure Celery reflects it
        if "localhost" in self.REDIS_URL or "127.0.0.1" in self.REDIS_URL:
            self.CELERY_BROKER_URL = self.REDIS_URL
            self.CELERY_RESULT_BACKEND = self.REDIS_URL
            
        return self

settings = Settings()
