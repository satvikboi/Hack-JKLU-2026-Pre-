"""ChromaDB wrapper — per-session isolated collections (local persistent)."""

from __future__ import annotations

from typing import List, Optional

import chromadb

from config import settings
from app.models.internal import Chunk, RetrievedChunk
from app.utils.logger import get_logger
from app.utils import metrics as m

log = get_logger("vector_store")


class VectorStore:
    """ChromaDB wrapper with per-session isolated collections."""

    _instance = None

    def __new__(cls) -> "VectorStore":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._client = None
        return cls._instance

    def initialize(self) -> None:
        """Initialize ChromaDB persistent client."""
        from app.utils.helpers import ensure_dir

        persist_dir = settings.CHROMA_PERSIST_DIR
        ensure_dir(persist_dir)
        self._client = chromadb.PersistentClient(
            path=persist_dir,
            settings=chromadb.Settings(
                anonymized_telemetry=False,
                allow_reset=True,
                chroma_telemetry_impl="none",
            ),
        )
        log.info("chromadb_initialized", path=persist_dir)

    @property
    def client(self):
        if self._client is None:
            self.initialize()
        return self._client

    def get_or_create_collection(self, session_id: str):
        """Get or create a per-session collection."""
        name = f"session_{session_id.replace('-', '_')[:48]}"
        collection = self.client.get_or_create_collection(
            name=name,
            metadata={"session_id": session_id},
        )
        return collection

    async def add_chunks(
        self,
        session_id: str,
        chunks: List[Chunk],
        embeddings: List[List[float]],
    ) -> int:
        """Batch upsert chunks + embeddings into session collection."""
        collection = self.get_or_create_collection(session_id)

        ids = [c.chunk_id for c in chunks]
        documents = [c.text for c in chunks]
        metadatas = [
            {
                "clause_number": c.clause_number or "",
                "page": c.page or 0,
                "index": c.index,
                "session_id": session_id,
            }
            for c in chunks
        ]

        collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        count = collection.count()
        m.CHROMA_COLLECTIONS.inc()
        log.info("chunks_added", session_id=session_id[:8], count=len(chunks), total=count)
        return count

    async def query(
        self,
        session_id: str,
        query_embedding: List[float],
        n_results: int = 6,
        where: Optional[dict] = None,
    ) -> List[RetrievedChunk]:
        """Cosine similarity search in session collection."""
        collection = self.get_or_create_collection(session_id)

        if collection.count() == 0:
            return []

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(n_results, collection.count()),
            where=where,
        )

        retrieved: List[RetrievedChunk] = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                meta = results["metadatas"][0][i] if results["metadatas"] else {}
                dist = results["distances"][0][i] if results["distances"] else 0.0
                retrieved.append(
                    RetrievedChunk(
                        text=doc,
                        distance=dist,
                        chunk_id=results["ids"][0][i] if results["ids"] else "",
                        clause_number=meta.get("clause_number"),
                        page=meta.get("page"),
                        metadata=meta,
                    )
                )

        return retrieved

    async def delete_collection(self, session_id: str) -> bool:
        """Delete entire session collection."""
        name = f"session_{session_id.replace('-', '_')[:48]}"
        try:
            self.client.delete_collection(name=name)
            m.CHROMA_COLLECTIONS.dec()
            log.info("collection_deleted", name=name)
            return True
        except Exception:
            return False

    async def get_collection_stats(self, session_id: str) -> dict:
        """Return collection stats."""
        try:
            collection = self.get_or_create_collection(session_id)
            return {"count": collection.count(), "session_id": session_id}
        except Exception:
            return {"count": 0, "session_id": session_id}
