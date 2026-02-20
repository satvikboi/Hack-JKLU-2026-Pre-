"""RAG pipeline — retrieval + prompt construction + inference."""

from __future__ import annotations

import time
from typing import Optional

from app.models.internal import ParsedDocument, IngestionResult, ChunkConfig
from app.services.vector_store import VectorStore
from app.services.embedder import EmbeddingService
from app.services.ollama_client import OllamaClient
from app.services.chunker import LegalTextChunker
from app.utils.helpers import generate_id
from app.utils.logger import get_logger

log = get_logger("rag")


class RAGPipeline:
    """Core RAG orchestrator — combines retrieval, prompting, and inference."""

    def __init__(
        self,
        vector_store: VectorStore,
        embedder: EmbeddingService,
        ollama: OllamaClient,
    ):
        self.vs = vector_store
        self.embedder = embedder
        self.ollama = ollama
        self.chunker = LegalTextChunker()

    async def query(
        self,
        session_id: str,
        question: str,
        system_prompt: str,
        n_retrieve: int = 6,
        json_mode: bool = False,
        metadata_filter: Optional[dict] = None,
    ) -> str:
        """Full RAG cycle: embed → retrieve → prompt → generate."""
        # 1. Embed the question
        q_emb = self.embedder.embed_query(question)

        # 2. Retrieve top-k chunks
        chunks = await self.vs.query(
            session_id=session_id,
            query_embedding=q_emb,
            n_results=n_retrieve,
            where=metadata_filter,
        )

        # 3. Build context
        context_parts = []
        for i, c in enumerate(chunks):
            clause_info = f" (Clause {c.clause_number})" if c.clause_number else ""
            page_info = f" [Page {c.page}]" if c.page else ""
            context_parts.append(f"[{i + 1}]{clause_info}{page_info}: {c.text}")

        context = "\n\n".join(context_parts)

        # 4. Build final prompt
        prompt = f"Context from the contract:\n{context}\n\n---\n\nQuestion:\n{question}"

        # 5. Generate response
        response = await self.ollama.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            json_mode=json_mode,
        )

        log.info(
            "rag_query",
            session_id=session_id[:8],
            chunks_retrieved=len(chunks),
            response_len=len(response),
        )
        return response

    async def ingest_document(
        self,
        session_id: str,
        parsed_doc: ParsedDocument,
        chunk_config: Optional[ChunkConfig] = None,
    ) -> IngestionResult:
        """Chunk → embed → store in ChromaDB."""
        start = time.time()

        # 1. Chunk
        config = chunk_config or ChunkConfig()
        chunks = self.chunker.chunk(parsed_doc.markdown, config)

        if not chunks:
            return IngestionResult(chunks_stored=0, collection_id="", ingestion_time_ms=0)

        # 2. Batch embed
        texts = [c.text for c in chunks]
        embeddings = self.embedder.embed_texts(texts)

        # 3. Store
        count = await self.vs.add_chunks(session_id, chunks, embeddings)

        elapsed_ms = int((time.time() - start) * 1000)
        log.info(
            "document_ingested",
            session_id=session_id[:8],
            chunks=count,
            time_ms=elapsed_ms,
        )
        return IngestionResult(
            chunks_stored=count,
            collection_id=f"session_{session_id}",
            ingestion_time_ms=elapsed_ms,
        )
