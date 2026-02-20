"""Health check endpoint."""

from __future__ import annotations

import time

from fastapi import APIRouter

from config import settings
from app.models.responses import HealthCheck
from app.services.ollama_client import LLMClient
from app.services.vector_store import VectorStore
from app.api.deps import get_redis, get_session_manager

router = APIRouter()
_start_time = time.time()


@router.get("/health", response_model=HealthCheck)
async def health_check():
    """Liveness + readiness check."""
    checks = {}

    # OpenRouter LLM
    try:
        llm = LLMClient()
        checks["openrouter"] = await llm.health_check()
    except Exception:
        checks["openrouter"] = False

    # Redis
    try:
        redis = await get_redis()
        await redis.ping()
        checks["redis"] = True
    except Exception:
        checks["redis"] = False

    # ChromaDB
    try:
        vs = VectorStore()
        _ = vs.client.heartbeat()
        checks["chromadb"] = True
    except Exception:
        checks["chromadb"] = False

    # Active sessions
    try:
        mgr = await get_session_manager()
        checks["active_sessions"] = await mgr.get_active_sessions_count()
    except Exception:
        checks["active_sessions"] = 0

    checks["model"] = settings.OPENROUTER_MODEL

    all_ok = checks.get("redis", False)
    some_ok = any(v for k, v in checks.items() if isinstance(v, bool) and v)

    status = "healthy" if all_ok else "degraded" if some_ok else "unhealthy"

    return HealthCheck(
        status=status,
        checks=checks,
        version=settings.APP_VERSION,
        uptime_seconds=int(time.time() - _start_time),
    )
