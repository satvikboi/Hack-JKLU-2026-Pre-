"""Core analysis endpoint — POST /analyze."""

from __future__ import annotations

import time
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form

from app.api.deps import get_session, get_session_manager
from app.models.responses import AnalysisResponse
from app.security.session_manager import Session
from app.security.file_validator import FileValidator
from app.services.document_parser import DocumentParser
from app.services.embedder import EmbeddingService
from app.services.vector_store import VectorStore
from app.services.ollama_client import OllamaClient
from app.services.rag_pipeline import RAGPipeline
from app.services.blindspot_analyzer import BlindspotAnalyzer
from app.services.risk_scorer import RiskScorer
from app.utils.logger import get_logger
from app.utils import metrics as m

router = APIRouter()
log = get_logger("analyze_route")


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_contract(
    session: Session = Depends(get_session),
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    contract_type: Optional[str] = Form(None),
    language: str = Form("en"),
):
    """Full contract analysis pipeline."""
    start = time.time()

    # 1. Validate input
    parser = DocumentParser()
    parsed_doc = None

    if file:
        validator = FileValidator()
        validated = await validator.validate(file, session.id)
        m.FILES_PROCESSED.labels(mime_type=validated.mime_type).inc()
        parsed_doc = await parser.parse(validated.path, validated.mime_type)
    elif text:
        from app.models.internal import ParsedDocument
        parsed_doc = ParsedDocument(text=text, markdown=text, mime_type="text/plain")
    else:
        from app.utils.exceptions import http_400
        raise http_400("Either 'file' or 'text' must be provided")

    # 2. Detect contract type
    if not contract_type:
        contract_type = parser.detect_contract_type(parsed_doc.text)

    # 3. Initialize pipeline
    embedder = EmbeddingService()
    vs = VectorStore()
    ollama = OllamaClient()
    rag = RAGPipeline(vs, embedder, ollama)

    # 4. Ingest document
    ingestion = await rag.ingest_document(session.id, parsed_doc)

    # 5. Run risk scoring (includes blindspot analysis)
    blindspot = BlindspotAnalyzer(rag)
    scorer = RiskScorer(rag, blindspot)
    result = await scorer.score(session.id, contract_type, language)

    # 6. Enrich result
    result.contract_text = parsed_doc.text
    result.pages_analyzed = parsed_doc.page_count
    result.chunks_indexed = ingestion.chunks_stored
    result.processing_time_ms = int((time.time() - start) * 1000)
    result.expires_at = session.expires_at

    # 7. Store result for later use (pushback, report)
    mgr = await get_session_manager()
    await mgr.store_analysis_result(session.id, result.analysis_id, result.model_dump(mode="json"))

    log.info(
        "analysis_complete",
        session_id=session.id[:8],
        contract_type=contract_type,
        score=result.risk_score,
        time_ms=result.processing_time_ms,
    )

    return result
