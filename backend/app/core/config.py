
from pydantic_settings import BaseSettings
from typing import List, Union

class Settings(BaseSettings):
    PROJECT_NAME: str = "Tews CRM"
    API_V1_STR: str = "/api/v1"
    
    # DATABASE
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./crm.db"

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
    GEMINI_API_KEY_1: str = "AIzaSyA-C-ONNj0jm90WiZPBEibDn0L3fvrys40"
    GEMINI_API_KEY_2: str = "AIzaSyCaYJ7_D3_6_xB3jfS_UTwMPxoP2ssIbkk"
    GEMINI_API_KEY_3: str = "AIzaSyAdlRe6MaqzN_mQsNfHdqcV_QOmfQwwDEY"
    GEMINI_API_KEY_4: str = "AIzaSyDdIhcWY0GKZqH0FuUf1--zgCXlLqXYOxo"
    GEMINI_API_KEY_5: str = ""  # Add more keys here to expand the pool
    GEMINI_API_KEY_6: str = ""  # Add more keys here to expand the pool

    # External APIs
    STABLE_HORDE_API_KEY: str = "7LGsqLjIsFMXtsnwbgobTA"
    TWITTER_CONSUMER_KEY: str = "n6WhBu3WFF3OU0qwEDwD1Zrza"
    TWITTER_CONSUMER_SECRET: str = "kjvqKWucaPNfFAFhT8y1HdbDFr00uiIHqU1uQ6gPCsCh6MznJ8"
    TWITTER_ACCESS_TOKEN: str = "1784831051531243520-GlRNKbdW59CgM2hm91MJUn5JyaY2t2"
    TWITTER_ACCESS_TOKEN_SECRET: str = "ZWrMnCCUyouuWxYkxEGW3rws3pL8SACvR7jW8Pl1EZEVx"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
