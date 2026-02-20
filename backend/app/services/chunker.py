"""Smart legal text chunking — clause-aware splitting."""

from __future__ import annotations

import re
from typing import List, Optional

from app.models.internal import Chunk, ChunkConfig
from app.utils.helpers import generate_id

# Regex patterns for clause boundaries
_CLAUSE_RE = re.compile(r"^(\d+\.[\d.]*|\([a-z]+\)|[A-Z]+\.)\s", re.MULTILINE)
_TABLE_RE = re.compile(r"(\|.+\|[\s\S]*?\|.+\|)", re.MULTILINE)


class LegalTextChunker:
    """Legal documents need smart chunking — clauses stay together."""

    def chunk(self, markdown: str, config: Optional[ChunkConfig] = None) -> List[Chunk]:
        """Split legal text into clause-aware chunks."""
        config = config or ChunkConfig()
        chunks: List[Chunk] = []

        # Step 1: Protect tables from splitting
        tables = {}
        for i, match in enumerate(_TABLE_RE.finditer(markdown)):
            placeholder = f"__TABLE_{i}__"
            tables[placeholder] = match.group(0)
            markdown = markdown.replace(match.group(0), placeholder, 1)

        # Step 2: Split on clause boundaries
        sections = self._split_on_clauses(markdown)

        # Step 3: Process each section
        idx = 0
        for section_text, clause_num in sections:
            # Restore tables
            for placeholder, table_text in tables.items():
                section_text = section_text.replace(placeholder, table_text)

            if len(section_text) <= config.max_size:
                chunks.append(Chunk(
                    text=section_text.strip(),
                    chunk_id=generate_id(),
                    clause_number=clause_num,
                    index=idx,
                ))
                idx += 1
            else:
                # Split on sentence boundaries
                sub_chunks = self._split_on_sentences(section_text, config.max_size, config.overlap)
                for sc in sub_chunks:
                    chunks.append(Chunk(
                        text=sc.strip(),
                        chunk_id=generate_id(),
                        clause_number=clause_num,
                        index=idx,
                    ))
                    idx += 1

        return [c for c in chunks if c.text.strip()]

    def _split_on_clauses(self, text: str) -> List[tuple[str, Optional[str]]]:
        """Split text at clause number boundaries."""
        matches = list(_CLAUSE_RE.finditer(text))

        if not matches:
            return [(text, None)]

        sections: List[tuple[str, Optional[str]]] = []

        # Text before first clause
        if matches[0].start() > 0:
            preamble = text[: matches[0].start()].strip()
            if preamble:
                sections.append((preamble, None))

        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            section_text = text[start:end]
            clause_num = match.group(1).strip()
            sections.append((section_text, clause_num))

        return sections

    def _split_on_sentences(self, text: str, max_size: int, overlap: int) -> List[str]:
        """Split long text on sentence boundaries with overlap."""
        sentences = re.split(r"(?<=[.!?])\s+", text)
        chunks: List[str] = []
        current: List[str] = []
        current_len = 0

        for sent in sentences:
            sent_len = len(sent)
            if current_len + sent_len > max_size and current:
                chunks.append(" ".join(current))
                # Keep last sentence for overlap
                overlap_sents = []
                overlap_len = 0
                for s in reversed(current):
                    if overlap_len + len(s) > overlap:
                        break
                    overlap_sents.insert(0, s)
                    overlap_len += len(s)
                current = overlap_sents
                current_len = overlap_len

            current.append(sent)
            current_len += sent_len

        if current:
            chunks.append(" ".join(current))

        return chunks
