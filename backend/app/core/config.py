from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database configuration
    DATABASE_URL: str = "postgresql://bugboard:bugboard123@localhost:5432/bugboard_db"

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    OLLAMA_TIMEOUT: int = 60

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:4200",
        "http://localhost:3000",
    ]

    APP_NAME: str = "BugBoard"
    DEBUG: bool = True

    class Config:
        env_file = ".env"


# global settings instance
settings = Settings()