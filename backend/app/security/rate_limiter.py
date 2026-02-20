"""Redis-backed sliding-window rate limiter via slowapi."""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from config import settings

# Global limiter instance – mount in FastAPI app
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[
        f"{settings.RATE_LIMIT_PER_MINUTE}/minute",
        f"{settings.RATE_LIMIT_PER_HOUR}/hour",
    ],
    storage_uri=settings.REDIS_URL,
    strategy="moving-window",
)
