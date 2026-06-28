from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str = ""
    embedding_model: str = "all-MiniLM-L6-v2"
    groq_model: str = "llama3-70b-8192"
    max_upload_size_mb: int = 50
    chunk_size: int = 800
    chunk_overlap: int = 150
    top_k_results: int = 6

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
