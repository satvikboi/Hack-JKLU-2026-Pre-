"""Scheduled session wipe task."""

from app.tasks.celery_app import celery_app
from app.utils.logger import get_logger

log = get_logger("wipe_task")


@celery_app.task(name="app.tasks.wipe_task.scheduled_wipe")
def scheduled_wipe():
    """Celery beat task — runs every 15 minutes to clean expired sessions."""
    import asyncio
    import redis.asyncio as aioredis

    from config import settings
    from app.security.session_manager import SessionManager
    from app.security.auto_wipe import AutoWipeService
    from app.services.vector_store import VectorStore

    async def _do_sweep():
        redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        mgr = SessionManager(redis_client, settings.SESSION_TTL_SECONDS)
        vs = VectorStore()
        wiper = AutoWipeService(session_manager=mgr, chroma_client=vs.client)
        wiped = await wiper.scheduled_sweep()
        await redis_client.aclose()
        return wiped

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        wiped = loop.run_until_complete(_do_sweep())
        log.info("scheduled_wipe_complete", sessions_wiped=wiped)
    finally:
        loop.close()
