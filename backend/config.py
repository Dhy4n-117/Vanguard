"""
Vanguard Sentinel — Configuration
Loads environment variables via Pydantic BaseSettings.
"""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # ── Neo4j ──────────────────────────────────
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "vanguard_sentinel_2024"

    # ── ChromaDB ───────────────────────────────
    chroma_persist_dir: str = "./backend/chroma_db"

    # ── Google Gemini ──────────────────────────
    gemini_api_key: str = ""

    # ── Server ─────────────────────────────────
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # ── Frontend ───────────────────────────────
    frontend_url: str = "http://localhost:3000"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
