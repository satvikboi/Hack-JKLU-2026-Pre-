"""Tests for file validator."""

import pytest
import pytest_asyncio
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

from app.security.file_validator import FileValidator, ValidatedFile
from app.utils.exceptions import FileValidationError


class TestFileValidator:
    def setup_method(self):
        self.validator = FileValidator(upload_dir="/tmp/test_uploads", max_size_mb=1)

    @pytest.mark.asyncio
    async def test_valid_text_file(self, tmp_path):
        content = b"This is a valid contract document."
        mock_file = AsyncMock()
        mock_file.filename = "contract.txt"
        mock_file.read = AsyncMock(return_value=content)

        result = await self.validator.validate(mock_file, "test-session-id")
        assert result.safe
        assert result.mime_type == "text/plain"
        assert result.size_bytes == len(content)

    @pytest.mark.asyncio
    async def test_reject_exe_extension(self):
        mock_file = AsyncMock()
        mock_file.filename = "malware.exe"
        mock_file.read = AsyncMock(return_value=b"fake")

        with pytest.raises(FileValidationError, match="not allowed"):
            await self.validator.validate(mock_file, "test-session")

    @pytest.mark.asyncio
    async def test_reject_oversized_file(self):
        mock_file = AsyncMock()
        mock_file.filename = "huge.txt"
        mock_file.read = AsyncMock(return_value=b"x" * (2 * 1024 * 1024))  # 2MB

        with pytest.raises(FileValidationError, match="too large"):
            await self.validator.validate(mock_file, "test-session")

    @pytest.mark.asyncio
    async def test_reject_empty_file(self):
        mock_file = AsyncMock()
        mock_file.filename = "empty.txt"
        mock_file.read = AsyncMock(return_value=b"")

        with pytest.raises(FileValidationError, match="Empty"):
            await self.validator.validate(mock_file, "test-session")

    def test_pdf_safety_check_detects_javascript(self):
        content = b"%PDF-1.4\n/JavaScript (alert('hack'))"
        with pytest.raises(FileValidationError, match="JavaScript"):
            self.validator._check_pdf_safety(content)

    def test_pdf_safety_passes_normal(self):
        content = b"%PDF-1.4\n/Type /Page\n/Contents stream\nBT /F1 12 Tf (Hello) Tj ET\nendstream"
        self.validator._check_pdf_safety(content)  # Should not raise

    def test_mime_detection_pdf(self):
        content = b"%PDF-1.4 rest of file"
        mime = self.validator._detect_mime(content, ".pdf")
        assert mime == "application/pdf"

    def test_mime_detection_png(self):
        content = b"\x89PNG\r\n\x1a\n rest"
        mime = self.validator._detect_mime(content, ".png")
        assert mime == "image/png"
