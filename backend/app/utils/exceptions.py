"""Custom exception hierarchy for LegalSaathi."""

from __future__ import annotations

from fastapi import HTTPException, status


class LegalSaathiError(Exception):
    """Base exception for all LegalSaathi errors."""
    def __init__(self, message: str = "An internal error occurred"):
        self.message = message
        super().__init__(self.message)


class FileValidationError(LegalSaathiError):
    """Raised when uploaded file fails validation."""
    def __init__(self, reason: str):
        super().__init__(f"File validation failed: {reason}")
        self.reason = reason


class SessionExpiredError(LegalSaathiError):
    """Raised when session has expired or does not exist."""
    def __init__(self, session_id: str = ""):
        super().__init__(f"Session expired or not found: {session_id[:8]}...")
        self.session_id = session_id


class SessionNotFoundError(SessionExpiredError):
    """Alias for clarity."""
    pass


class EncryptionError(LegalSaathiError):
    """Raised on encryption/decryption failure."""
    pass


class OllamaError(LegalSaathiError):
    """Raised when Ollama inference fails."""
    def __init__(self, message: str = "Ollama inference failed", status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


class OllamaModelNotFoundError(OllamaError):
    """Raised when the requested model isn't available."""
    pass


class RateLimitExceededError(LegalSaathiError):
    """Raised when rate limit is exceeded."""
    pass


class DocumentParsingError(LegalSaathiError):
    """Raised when document parsing fails."""
    pass


class AnalysisError(LegalSaathiError):
    """Raised during contract analysis."""
    pass


class VoiceServiceError(LegalSaathiError):
    """Raised during voice processing."""
    pass


class TranslationError(LegalSaathiError):
    """Raised during translation."""
    pass


# ── HTTP Exception helpers ───────────────────────────────
def http_400(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def http_404(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def http_413(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=detail)


def http_429(detail: str = "Rate limit exceeded") -> HTTPException:
    return HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)


def http_500(detail: str = "Internal server error") -> HTTPException:
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


def http_503(detail: str = "Service unavailable") -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)
