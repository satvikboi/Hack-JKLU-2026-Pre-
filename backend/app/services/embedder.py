"""Embedding service — multilingual-e5-large (singleton)."""

from __future__ import annotations

import time
from typing import List

from config import settings
from app.utils.logger import get_logger
from app.utils import metrics as m

log = get_logger("embedder")


class EmbeddingService:
    """Singleton embedding — model loaded once, reused for all requests."""

    _instance = None

    def __new__(cls) -> "EmbeddingService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._model = None
        return cls._instance

    def load_model(self) -> None:
        """Load sentence-transformer model (call at startup)."""
        from sentence_transformers import SentenceTransformer

        log.info("loading_embedding_model", model=settings.EMBEDDING_MODEL)
        start = time.time()
        self._model = SentenceTransformer(
            settings.EMBEDDING_MODEL,
            device=settings.EMBEDDING_DEVICE,
        )
        elapsed = time.time() - start
        log.info("embedding_model_loaded", model=settings.EMBEDDING_MODEL, seconds=round(elapsed, 2))

    def _ensure_loaded(self) -> None:
        if self._model is None:
            self.load_model()

    def embed_texts(self, texts: List[str], prefix: str = "passage: ") -> List[List[float]]:
        """Batch embed documents. E5 models require 'passage: ' prefix for docs."""
        self._ensure_loaded()
        prefixed = [f"{prefix}{t}" for t in texts]
        start = time.time()
        embeddings = self._model.encode(prefixed, normalize_embeddings=True, show_progress_bar=False)
        m.EMBEDDING_DURATION.observe(time.time() - start)
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        """Embed a single query. E5 models require 'query: ' prefix."""
        self._ensure_loaded()
        start = time.time()
        embedding = self._model.encode(f"query: {query}", normalize_embeddings=True, show_progress_bar=False)
        m.EMBEDDING_DURATION.observe(time.time() - start)
        return embedding.tolist()
