"""Session management endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response

from app.api.deps import get_session_manager, get_session
from app.models.responses import SessionResponse, SessionDeleteResponse
from app.security.session_manager import SessionManager, Session
from app.security.auto_wipe import AutoWipeService
from app.services.vector_store import VectorStore

router = APIRouter()


@router.post("/session", response_model=SessionResponse)
async def create_session(response: Response, mgr: SessionManager = Depends(get_session_manager)):
    """Create a new anonymous session."""
    session = await mgr.create_session()

    response.set_cookie(
        key="legalsaathi_session",
        value=session.id,
        httponly=True,
        secure=False,  # Set True in production with HTTPS
        samesite="lax",
        max_age=int(session.expires_at.timestamp() - session.created_at.timestamp()),
    )

    return SessionResponse(
        session_id=session.id,
        expires_at=session.expires_at,
        encryption_key_hint=session.encryption_key[:4],
    )


@router.delete("/session", response_model=SessionDeleteResponse)
async def delete_session(
    session: Session = Depends(get_session),
    mgr: SessionManager = Depends(get_session_manager),
):
    """Immediately wipe all session data."""
    vs = VectorStore()
    wiper = AutoWipeService(session_manager=mgr, chroma_client=vs.client)
    report = await wiper.wipe_session_data(session.id)

    return SessionDeleteResponse(
        wiped=True,
        files_deleted=report.files_deleted,
        vectors_deleted=report.vectors_deleted,
        message="Your data has been permanently deleted.",
    )
