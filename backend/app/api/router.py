"""Master router — mounts all sub-routers."""

from fastapi import APIRouter

from app.api.routes import health, session, analyze, compare, pushback, voice, laws, query

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(session.router, tags=["Session"])
api_router.include_router(analyze.router, tags=["Analysis"])
api_router.include_router(compare.router, tags=["Compare"])
api_router.include_router(pushback.router, tags=["Pushback"])
api_router.include_router(voice.router, tags=["Voice"])
api_router.include_router(laws.router, tags=["Laws"])
api_router.include_router(query.router, tags=["Query"])

