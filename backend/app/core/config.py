
from pydantic_settings import BaseSettings
from typing import List, Union

class Settings(BaseSettings):
    PROJECT_NAME: str = "TEWS Intelligence Engine"
    API_V1_STR: str = "/api/v1"
    
    # DATABASE
    # PostgreSQL connection string: postgresql://user:password@postgresserver/db
    SQLALCHEMY_DATABASE_URI: str = "postgresql://postgres:postgres@localhost:5432/tews"

    # REDIS / CELERY
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = REDIS_URL
    CELERY_RESULT_BACKEND: str = REDIS_URL

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
    GEMINI_API_KEY_1: str = "AIzaSyAu4NGmJeJIBxz_-wyHK0HPkyEO0gOwW9M"
    # ... (rest of keys)
    GEMINI_API_KEY_2: str = "AIzaSyA4XjYd2iWjgBKblGtaFYTvrC5FgfhKSco"
    GEMINI_API_KEY_3: str = "AIzaSyBs4d5LZqNMMi_CYoS-JlzCbvpu6TwL3fw"
    GEMINI_API_KEY_4: str = "AIzaSyAn13XT6Iu0rJBw7oGvfoKCjQIPqv0F1GA"
    GEMINI_API_KEY_5: str = ""
    GEMINI_API_KEY_6: str = ""

    STABLE_HORDE_API_KEY: str = "7LGsqLjIsFMXtsnwbgobTA"
    TWITTER_CONSUMER_KEY: str = "n6WhBu3WFF3OU0qwEDwD1Zrza"
    TWITTER_CONSUMER_SECRET: str = "kjvqKWucaPNfFAFhT8y1HdbDFr00uiIHqU1uQ6gPCsCh6MznJ8"
    TWITTER_ACCESS_TOKEN: str = "1784831051531243520-GlRNKbdW59CgM2hm91MJUn5JyaY2t2"
    TWITTER_ACCESS_TOKEN_SECRET: str = "ZWrMnCCUyouuWxYkxEGW3rws3pL8SACvR7jW8Pl1EZEVx"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
