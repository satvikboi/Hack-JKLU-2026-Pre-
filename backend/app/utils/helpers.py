"""Miscellaneous utility helpers."""

from __future__ import annotations

import hashlib
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path


def generate_id() -> str:
    """Generate a UUID4 string."""
    return str(uuid.uuid4())


def utcnow() -> datetime:
    """Current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


def ensure_dir(path: str | Path) -> Path:
    """Create directory if it doesn't exist, return Path."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def sha256_file(path: Path) -> str:
    """Compute SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def secure_delete(path: Path) -> None:
    """Overwrite file with zeros then delete (DoD 5220.22-M single-pass)."""
    if not path.exists():
        return
    size = path.stat().st_size
    with open(path, "wb") as f:
        f.write(b"\x00" * size)
        f.flush()
        os.fsync(f.fileno())
    path.unlink()


def format_bytes(n: int) -> str:
    """Human-readable byte size."""
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def clamp(value: int | float, lo: int | float, hi: int | float) -> int | float:
    """Clamp value between lo and hi."""
    return max(lo, min(hi, value))
