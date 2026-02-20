"""LegalSaathi — FastAPI application entry point."""

from __future__ import annotations

import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path

import redis.asyncio as aioredis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Ensure backend root is in path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import settings
from app.utils.logger import setup_logging, get_logger
from app.utils.helpers import ensure_dir
from app.utils.exceptions import (
    LegalSaathiError,
    SessionExpiredError,
    FileValidationError,
)
from app.api.router import api_router
from app.api import deps
from app.security.session_manager import SessionManager
from app.security.rate_limiter import limiter

setup_logging()
log = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    start = time.time()

    # 1. Create required directories
    ensure_dir(settings.TEMP_UPLOAD_DIR)
    ensure_dir(settings.TEMP_AUDIO_DIR)
    ensure_dir(settings.CHROMA_PERSIST_DIR)

    # 2. Connect Redis
    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        await redis_client.ping()
        log.info("redis_connected", url=settings.REDIS_URL)
    except Exception as e:
        log.error("redis_connection_failed", error=str(e))
        if settings.ENVIRONMENT == "production":
            raise

    # 3. Initialize session manager
    session_mgr = SessionManager(redis_client, settings.SESSION_TTL_SECONDS)
    deps.set_globals(redis_client, session_mgr)

    # 4. Initialize ChromaDB
    from app.services.vector_store import VectorStore
    vs = VectorStore()
    vs.initialize()

    # 5. Load embedding model (warm up)
    if settings.ENVIRONMENT != "development" or settings.DEBUG:
        try:
            from app.services.embedder import EmbeddingService
            embedder = EmbeddingService()
            embedder.load_model()
        except Exception as e:
            log.warning("embedding_model_warmup_failed", error=str(e))

    # 6. Check OpenRouter LLM connectivity
    from app.services.ollama_client import LLMClient
    llm = LLMClient()
    try:
        is_ready = await llm.health_check()
        if is_ready:
            log.info("openrouter_ready", model=settings.OPENROUTER_MODEL)
        else:
            log.warning("openrouter_unreachable", model=settings.OPENROUTER_MODEL)
    except Exception as e:
        log.warning("openrouter_health_check_failed", error=str(e))

    elapsed = time.time() - start
    log.info(
        "legalsaathi_backend_ready",
        model=settings.OPENROUTER_MODEL,
        embedding=settings.EMBEDDING_MODEL,
        startup_seconds=round(elapsed, 2),
    )

    yield

    # ── Shutdown ──────────────────────────────────────────
    log.info("shutdown_initiated")
    await llm.close()
    await redis_client.aclose()
    log.info("shutdown_complete")


# ── Create FastAPI app ────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="India's privacy-first AI legal assistant — powered by Qwen3 235B via OpenRouter",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Prometheus metrics (optional) ─────────────────────────
if settings.ENABLE_METRICS:
    try:
        from prometheus_fastapi_instrumentator import Instrumentator
        Instrumentator().instrument(app).expose(app, endpoint="/metrics")
    except ImportError:
        log.warning("prometheus_instrumentator_not_available")


# ── Exception handlers ───────────────────────────────────
@app.exception_handler(SessionExpiredError)
async def session_expired_handler(request: Request, exc: SessionExpiredError):
    return JSONResponse(status_code=401, content={"detail": exc.message})


@app.exception_handler(FileValidationError)
async def file_validation_handler(request: Request, exc: FileValidationError):
    return JSONResponse(status_code=400, content={"detail": exc.message})


@app.exception_handler(LegalSaathiError)
async def legalsaathi_error_handler(request: Request, exc: LegalSaathiError):
    return JSONResponse(status_code=500, content={"detail": exc.message})


# ── Mount API router ─────────────────────────────────────
app.include_router(api_router)


# ── Root endpoint ─────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "model": settings.OPENROUTER_MODEL,
        "docs": "/docs",
    }
