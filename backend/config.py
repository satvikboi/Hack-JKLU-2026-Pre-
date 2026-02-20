"""LegalSaathi — Application settings via pydantic-settings."""

from __future__ import annotations

import secrets
from pathlib import Path
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "LegalSaathi"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # ── Security ─────────────────────────────────────────
    SECRET_KEY: str = secrets.token_hex(32)
    ENCRYPTION_KEY: str = secrets.token_urlsafe(32)
    SESSION_TTL_SECONDS: int = 3600
    MAX_FILE_SIZE_MB: int = 25
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "image/png",
        "image/jpeg",
    ]

    # ── CORS ─────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── OpenRouter LLM ──────────────────────────────────
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "qwen/qwen3-235b-a22b"
    LLM_TIMEOUT: int = 120
    LLM_MAX_TOKENS: int = 4096
    LLM_TEMPERATURE: float = 0.1

    # ── ChromaDB (Local Persistent) ────────────────────
    CHROMA_PERSIST_DIR: str = "./data/chromadb"
    CHROMA_ENCRYPT_AT_REST: bool = True

    # ── Redis ────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: str = ""
    RATE_LIMIT_PER_MINUTE: int = 20
    RATE_LIMIT_PER_HOUR: int = 100

    # ── Embeddings ───────────────────────────────────────
    EMBEDDING_MODEL: str = "intfloat/multilingual-e5-large"
    EMBEDDING_DEVICE: str = "cpu"
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150
    TOP_K_RETRIEVAL: int = 6

    # ── Voice ────────────────────────────────────────────
    WHISPER_MODEL: str = "large-v3"
    WHISPER_DEVICE: str = "cpu"
    TTS_MODEL_DIR: str = "./models/xtts"
    SUPPORTED_LANGUAGES: List[str] = ["hi", "mr", "ta", "bn", "gu", "te", "en"]

    # ── Celery ───────────────────────────────────────────
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # ── Monitoring ───────────────────────────────────────
    ENABLE_METRICS: bool = True
    LOG_LEVEL: str = "INFO"

    # ── Storage (ephemeral) ──────────────────────────────
    TEMP_UPLOAD_DIR: str = "/tmp/legalsaathi/uploads"
    TEMP_AUDIO_DIR: str = "/tmp/legalsaathi/audio"

    # ── Derived paths ────────────────────────────────────
    BASE_DIR: str = str(Path(__file__).resolve().parent)

    @field_validator("ENCRYPTION_KEY")
    @classmethod
    def _validate_encryption_key(cls, v: str) -> str:
        if len(v) < 16:
            raise ValueError("ENCRYPTION_KEY must be at least 16 characters")
        return v


settings = Settings()
