"""Query endpoint — POST /query — ask questions about uploaded contracts."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Form

from app.api.deps import get_session
from app.security.session_manager import Session
from app.services.embedder import EmbeddingService
from app.services.vector_store import VectorStore
from app.services.ollama_client import LLMClient
from app.services.rag_pipeline import RAGPipeline
from app.utils.logger import get_logger
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
log = get_logger("query_route")


class QueryResponse(BaseModel):
    answer: str
    session_id: str
    sources: list = []


@router.post("/query", response_model=QueryResponse)
async def query_contract(
    session: Session = Depends(get_session),
    question: str = Form(...),
    language: str = Form("en"),
    contract_type: str = Form("loan"),
):
    """Ask a question about the uploaded contract using RAG."""
    from app.services.indian_acts_lookup import get_acts_context_for_prompt

    embedder = EmbeddingService()
    vs = VectorStore()
    llm = LLMClient()
    rag = RAGPipeline(vs, embedder, llm)

    acts_context = get_acts_context_for_prompt(contract_type)

    # Build system prompt
    system_prompt = (
        "You are LegalSaathi, an Indian legal expert. "
        "Answer the user's question ONLY based on the contract context provided. "
        "If the answer is not in the context, say 'This is not covered in the uploaded contract.' "
        f"\n\n{acts_context}\n\n"
        "Cite specific clauses and Indian law sections where applicable. "
        f"Respond in {'Hindi' if language == 'hi' else 'English'}. "
        "Keep your answer clear, concise, and useful."
    )

    # Use RAG to answer
    answer = await rag.query(
        session_id=session.id,
        question=question,
        system_prompt=system_prompt,
    )

    log.info("query_answered", session_id=session.id[:8], question_len=len(question))

    return QueryResponse(
        answer=answer,
        session_id=session.id,
        sources=[],
    )
