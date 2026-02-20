"""Anonymous session lifecycle manager backed by Redis."""

from __future__ import annotations

import json
from datetime import datetime, timezone

import redis.asyncio as aioredis

from app.security.encryption import EncryptionService
from app.utils.helpers import generate_id, utcnow
from app.utils.logger import get_logger
from app.utils import metrics as m

log = get_logger("session")

_PREFIX = "session:"


class Session:
    """In-memory representation of an anonymous session."""

    def __init__(self, session_id: str, created_at: datetime, expires_at: datetime, encryption_key: str):
        self.id = session_id
        self.created_at = created_at
        self.expires_at = expires_at
        self.encryption_key = encryption_key

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "encryption_key": self.encryption_key,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Session":
        return cls(
            session_id=d["id"],
            created_at=datetime.fromisoformat(d["created_at"]),
            expires_at=datetime.fromisoformat(d["expires_at"]),
            encryption_key=d["encryption_key"],
        )


class SessionManager:
    """Anonymous session lifecycle – no PII, no identity, just UUID4 + TTL."""

    def __init__(self, redis_client: aioredis.Redis, ttl: int = 3600):
        self.redis = redis_client
        self.ttl = ttl

    async def create_session(self) -> Session:
        """Create a new anonymous session with a per-session encryption key."""
        sid = generate_id()
        now = utcnow()
        from datetime import timedelta
        expires = now + timedelta(seconds=self.ttl)
        enc_key = EncryptionService.generate_key()

        session = Session(session_id=sid, created_at=now, expires_at=expires, encryption_key=enc_key)
        await self.redis.setex(f"{_PREFIX}{sid}", self.ttl, json.dumps(session.to_dict()))

        m.SESSIONS_CREATED.inc()
        m.ACTIVE_SESSIONS.inc()
        log.info("session_created", session_id=sid[:8])
        return session

    async def get_session(self, session_id: str) -> Session | None:
        """Retrieve session from Redis. Returns None if expired/missing."""
        raw = await self.redis.get(f"{_PREFIX}{session_id}")
        if raw is None:
            return None
        return Session.from_dict(json.loads(raw))

    async def extend_session(self, session_id: str) -> bool:
        """Reset TTL on activity. Returns True if session existed."""
        key = f"{_PREFIX}{session_id}"
        if await self.redis.exists(key):
            await self.redis.expire(key, self.ttl)
            log.debug("session_extended", session_id=session_id[:8])
            return True
        return False

    async def invalidate_session(self, session_id: str) -> dict:
        """Delete all data for a session — Redis key + associated data."""
        deleted = await self.redis.delete(f"{_PREFIX}{session_id}")
        # Delete any analysis results stored for this session
        pattern = f"{_PREFIX}{session_id}:*"
        keys = []
        async for key in self.redis.scan_iter(match=pattern):
            keys.append(key)
        if keys:
            await self.redis.delete(*keys)

        if deleted:
            m.ACTIVE_SESSIONS.dec()
            m.SESSIONS_WIPED.inc()
        log.info("session_invalidated", session_id=session_id[:8], keys_deleted=len(keys) + int(deleted))
        return {"redis_keys_deleted": len(keys) + int(deleted)}

    async def get_active_sessions_count(self) -> int:
        """Count active sessions (for monitoring)."""
        count = 0
        async for _ in self.redis.scan_iter(match=f"{_PREFIX}*"):
            count += 1
        return count

    async def store_analysis_result(self, session_id: str, analysis_id: str, result: dict) -> None:
        """Store an analysis result under the session namespace in Redis."""
        key = f"{_PREFIX}{session_id}:analysis:{analysis_id}"
        await self.redis.setex(key, self.ttl, json.dumps(result, default=str))

    async def get_analysis_result(self, session_id: str, analysis_id: str) -> dict | None:
        """Retrieve a stored analysis result."""
        key = f"{_PREFIX}{session_id}:analysis:{analysis_id}"
        raw = await self.redis.get(key)
        return json.loads(raw) if raw else None
