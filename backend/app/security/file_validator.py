"""Multi-layer uploaded-file validation."""

from __future__ import annotations

import struct
from pathlib import Path
from dataclasses import dataclass

from fastapi import UploadFile

from config import settings
from app.utils.exceptions import FileValidationError
from app.utils.helpers import ensure_dir, generate_id
from app.utils.logger import get_logger

log = get_logger("file_validator")

# Magic byte signatures for MIME verification
_MAGIC_SIGS: dict[bytes, str] = {
    b"%PDF": "application/pdf",
    b"\xd0\xcf\x11\xe0": "application/msword",  # OLE2 (.doc)
    b"\x89PNG": "image/png",
    b"\xff\xd8\xff": "image/jpeg",
}

# PK-based formats need extension to disambiguate
_PK_MIME_BY_EXT: dict[str, str] = {
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}


@dataclass
class ValidatedFile:
    path: Path
    mime_type: str
    size_bytes: int
    original_name: str
    safe: bool = True


class FileValidator:
    """Multi-layer file validation before processing."""

    def __init__(self, upload_dir: str = settings.TEMP_UPLOAD_DIR, max_size_mb: int = settings.MAX_FILE_SIZE_MB):
        self.upload_dir = Path(upload_dir)
        self.max_size_bytes = max_size_mb * 1024 * 1024
        self.allowed_mimes = set(settings.ALLOWED_MIME_TYPES)

    async def validate(self, file: UploadFile, session_id: str) -> ValidatedFile:
        """Run all validation checks and save file to session directory."""
        filename = file.filename or "unknown"

        # 1. Extension whitelist
        ext = Path(filename).suffix.lower()
        allowed_exts = {".pdf", ".docx", ".doc", ".pptx", ".txt", ".png", ".jpg", ".jpeg"}
        if ext not in allowed_exts:
            raise FileValidationError(f"File extension '{ext}' not allowed")

        # 2. Read file content
        content = await file.read()
        size = len(content)

        # 3. Size limit
        if size > self.max_size_bytes:
            raise FileValidationError(f"File too large: {size} bytes (max {self.max_size_bytes})")

        if size == 0:
            raise FileValidationError("Empty file")

        # 4. Magic-byte MIME verification
        mime_type = self._detect_mime(content, ext)
        if mime_type not in self.allowed_mimes:
            raise FileValidationError(f"MIME type '{mime_type}' not allowed")

        # 5. PDF safety check
        if mime_type == "application/pdf":
            self._check_pdf_safety(content)

        # 6. Image dimension sanity
        if mime_type.startswith("image/"):
            self._check_image_dimensions(content)

        # 7. Save to session directory
        session_dir = ensure_dir(self.upload_dir / session_id)
        safe_name = f"{generate_id()}{ext}"
        dest = session_dir / safe_name
        dest.write_bytes(content)

        log.info("file_validated", original=filename, mime=mime_type, size=size, session_id=session_id[:8])
        return ValidatedFile(path=dest, mime_type=mime_type, size_bytes=size, original_name=filename)

    def _detect_mime(self, content: bytes, ext: str) -> str:
        """Detect MIME type from magic bytes, fall back to extension."""
        # Check PK (ZIP-based) formats first — disambiguate by extension
        if content[:4] == b"PK\x03\x04":
            return _PK_MIME_BY_EXT.get(ext, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")

        for sig, mime in _MAGIC_SIGS.items():
            if content[:len(sig)] == sig:
                return mime

        # Fallback: trust extension for text
        if ext == ".txt":
            return "text/plain"

        return "application/octet-stream"

    def _check_pdf_safety(self, content: bytes) -> None:
        """Reject PDFs with embedded JavaScript."""
        text_repr = content[:100_000]  # Check first 100KB
        dangerous = [b"/JavaScript", b"/JS ", b"/Launch", b"/SubmitForm", b"/ImportData"]
        for pattern in dangerous:
            if pattern in text_repr:
                raise FileValidationError(f"PDF contains potentially dangerous element: {pattern.decode()}")

    def _check_image_dimensions(self, content: bytes) -> None:
        """Reject absurdly large images."""
        try:
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(content))
            w, h = img.size
            if w > 10000 or h > 10000:
                raise FileValidationError(f"Image dimensions too large: {w}x{h}")
        except FileValidationError:
            raise
        except Exception:
            pass  # If we can't parse, let the downstream parser handle it
