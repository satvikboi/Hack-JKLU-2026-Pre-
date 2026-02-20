"""Voice query endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends, UploadFile, File, Form
from typing import Optional

from app.api.deps import get_session
from app.models.responses import VoiceResponse
from app.security.session_manager import Session
from app.security.file_validator import FileValidator
from app.services.voice_service import VoiceService
from app.services.embedder import EmbeddingService
from app.services.vector_store import VectorStore
from app.services.ollama_client import OllamaClient
from app.services.rag_pipeline import RAGPipeline
from app.utils import metrics as m

router = APIRouter()


@router.post("/voice/query", response_model=VoiceResponse)
async def voice_query(
    session: Session = Depends(get_session),
    audio: UploadFile = File(...),
    session_has_contract: bool = Form(False),
    hint_language: Optional[str] = Form(None),
):
    """Full voice pipeline: transcribe → query → synthesize."""
    validator = FileValidator()
    validated = await validator.validate(audio, session.id)

    voice_svc = VoiceService()

    rag = None
    if session_has_contract:
        embedder = EmbeddingService()
        vs = VectorStore()
        ollama = OllamaClient()
        rag = RAGPipeline(vs, embedder, ollama)

    result = await voice_svc.process_voice_query(
        audio_path=validated.path,
        session_id=session.id,
        rag_pipeline=rag,
        hint_language=hint_language,
    )

    m.VOICE_QUERIES.labels(language=result.get("detected_language", "unknown")).inc()

    return VoiceResponse(**result)
