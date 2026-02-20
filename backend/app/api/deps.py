"""Shared dependencies for API routes."""

from __future__ import annotations

from typing import Optional

import redis.asyncio as aioredis
from fastapi import Header, Request, Depends

from config import settings
from app.security.session_manager import SessionManager, Session
from app.utils.exceptions import SessionExpiredError


# ── Global singletons (initialized in main.py startup) ───
_redis_client: Optional[aioredis.Redis] = None
_session_mgr: Optional[SessionManager] = None


async def get_redis() -> aioredis.Redis:
    """Get Redis client (set during startup)."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


async def get_session_manager() -> SessionManager:
    """Get SessionManager (set during startup)."""
    global _session_mgr
    if _session_mgr is None:
        redis = await get_redis()
        _session_mgr = SessionManager(redis, settings.SESSION_TTL_SECONDS)
    return _session_mgr


async def get_session(
    x_session_id: str = Header(None, alias="X-Session-ID"),
    request: Request = None,
) -> Session:
    """Validate and return session. Raises 401 if expired/missing."""
    session_id = x_session_id

    # Also check cookie
    if not session_id and request:
        session_id = request.cookies.get("legalsaathi_session")

    if not session_id:
        raise SessionExpiredError("No session ID provided")

    mgr = await get_session_manager()
    session = await mgr.get_session(session_id)

    if session is None:
        raise SessionExpiredError(session_id)

    # Extend TTL on activity
    await mgr.extend_session(session_id)
    return session


def set_globals(redis_client: aioredis.Redis, session_manager: SessionManager) -> None:
    """Called during startup to set global instances."""
    global _redis_client, _session_mgr
    _redis_client = redis_client
    _session_mgr = session_manager
