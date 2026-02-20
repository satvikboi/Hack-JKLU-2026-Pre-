"""Tests for vector store operations."""

import pytest
from app.services.chunker import LegalTextChunker
from app.models.internal import Chunk, ChunkConfig


class TestVectorStoreInit:
    """Test vector store initialization (unit tests, no ChromaDB required)."""

    def test_chunk_id_unique(self):
        from app.utils.helpers import generate_id
        ids = {generate_id() for _ in range(100)}
        assert len(ids) == 100

    def test_collection_name_format(self):
        session_id = "abc123-def456-ghi789"
        name = f"session_{session_id.replace('-', '_')[:48]}"
        assert name.startswith("session_")
        assert "-" not in name
        assert len(name) <= 63  # ChromaDB collection name limit
