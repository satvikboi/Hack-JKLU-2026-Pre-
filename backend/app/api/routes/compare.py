"""Compare drafts endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends, UploadFile, File, Form

from app.api.deps import get_session
from app.models.responses import RedlineReport
from app.security.session_manager import Session
from app.services.document_parser import DocumentParser
from app.services.embedder import EmbeddingService
from app.services.vector_store import VectorStore
from app.services.ollama_client import OllamaClient
from app.services.rag_pipeline import RAGPipeline
from app.services.redline_comparator import RedlineComparator
from app.security.file_validator import FileValidator

router = APIRouter()


@router.post("/compare", response_model=RedlineReport)
async def compare_drafts(
    session: Session = Depends(get_session),
    draft1: UploadFile = File(...),
    draft2: UploadFile = File(...),
    language: str = Form("en"),
):
    """Compare two contract drafts and detect changes."""
    validator = FileValidator()
    parser = DocumentParser()

    file1 = await validator.validate(draft1, session.id)
    file2 = await validator.validate(draft2, session.id)

    doc1 = await parser.parse(file1.path, file1.mime_type)
    doc2 = await parser.parse(file2.path, file2.mime_type)

    embedder = EmbeddingService()
    vs = VectorStore()
    ollama = OllamaClient()
    rag = RAGPipeline(vs, embedder, ollama)

    comparator = RedlineComparator(rag)
    report = await comparator.compare(doc1.text, doc2.text, session.id, language)

    return report
