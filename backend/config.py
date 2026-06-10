from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "Nexora"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "vscode-webview://*"]
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "nexora.log"
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/nexora"
    VECTOR_STORE_DIMENSION: int = 1536
    VECTOR_STORE_COLLECTION: str = "nexora_memory"
    LLM_PROVIDER: str = "ollama"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5-coder:7b"
    MAX_ITERATIONS: int = 50
    TIMEOUT_SECONDS: int = 300

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
