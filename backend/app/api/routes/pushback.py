"""Pushback email generation endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_session, get_session_manager
from app.models.requests import PushbackRequest
from app.models.responses import PushbackEmail
from app.security.session_manager import Session
from app.services.ollama_client import OllamaClient
from app.services.pushback_generator import PushbackGenerator
from app.utils.exceptions import http_404

router = APIRouter()


@router.post("/pushback", response_model=PushbackEmail)
async def generate_pushback(
    body: PushbackRequest,
    session: Session = Depends(get_session),
):
    """Generate a legally-grounded pushback email from analysis results."""
    mgr = await get_session_manager()
    result = await mgr.get_analysis_result(session.id, body.analysis_id)

    if not result:
        raise http_404(f"Analysis '{body.analysis_id}' not found in session")

    from app.models.responses import RedFlag
    red_flags = [RedFlag(**f) for f in result.get("red_flags", [])]

    if not red_flags:
        return PushbackEmail(
            subject="No Issues Found",
            body="No red flags were identified in the analysis.",
            law_citations=[],
            word_count=8,
            language=body.language,
        )

    ollama = OllamaClient()
    generator = PushbackGenerator(ollama)
    email = await generator.generate(
        red_flags=red_flags,
        recipient_type=body.recipient_type,
        tone=body.tone,
        language=body.language,
        sender_name=body.sender_name,
    )

    return email
