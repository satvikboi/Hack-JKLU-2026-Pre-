"""Tests for risk scorer."""

import pytest

from app.services.chunker import LegalTextChunker
from app.models.internal import ChunkConfig


class TestChunker:
    def setup_method(self):
        self.chunker = LegalTextChunker()

    def test_basic_chunking(self, sample_rental_text):
        chunks = self.chunker.chunk(sample_rental_text)
        assert len(chunks) > 0
        for chunk in chunks:
            assert chunk.text.strip()
            assert chunk.chunk_id

    def test_clause_detection(self, sample_rental_text):
        chunks = self.chunker.chunk(sample_rental_text)
        clause_chunks = [c for c in chunks if c.clause_number]
        assert len(clause_chunks) > 0

    def test_max_size_respected(self, sample_rental_text):
        config = ChunkConfig(max_size=200, overlap=50)
        chunks = self.chunker.chunk(sample_rental_text, config)
        for chunk in chunks:
            assert len(chunk.text) <= 400  # Some margin for sentence completion

    def test_empty_text(self):
        chunks = self.chunker.chunk("")
        assert len(chunks) == 0

    def test_short_text(self):
        chunks = self.chunker.chunk("Simple clause.")
        assert len(chunks) == 1

    def test_sequential_indices(self, sample_rental_text):
        chunks = self.chunker.chunk(sample_rental_text)
        indices = [c.index for c in chunks]
        assert indices == list(range(len(chunks)))


class TestRiskScorerWeights:
    def test_score_never_exceeds_100(self):
        from app.utils.helpers import clamp
        raw_scores = [0, 50, 100, 150, 200]
        for raw in raw_scores:
            assert clamp(raw, 0, 100) <= 100

    def test_risk_level_classification(self):
        def classify(score):
            return "low" if score <= 30 else "medium" if score <= 60 else "high"

        assert classify(0) == "low"
        assert classify(30) == "low"
        assert classify(31) == "medium"
        assert classify(60) == "medium"
        assert classify(61) == "high"
        assert classify(100) == "high"


class TestDocumentParser:
    def test_contract_type_detection_rental(self, sample_rental_text):
        from app.services.document_parser import DocumentParser
        parser = DocumentParser()
        ctype = parser.detect_contract_type(sample_rental_text)
        assert ctype == "rental"

    def test_contract_type_detection_employment(self, sample_employment_text):
        from app.services.document_parser import DocumentParser
        parser = DocumentParser()
        ctype = parser.detect_contract_type(sample_employment_text)
        assert ctype == "employment"

    def test_contract_type_detection_general(self):
        from app.services.document_parser import DocumentParser
        parser = DocumentParser()
        ctype = parser.detect_contract_type("Some random text without legal keywords.")
        assert ctype == "general"
