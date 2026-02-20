"""AES-256-GCM authenticated encryption service."""

from __future__ import annotations

import base64
import os
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.utils.exceptions import EncryptionError
from app.utils.logger import get_logger

log = get_logger("encryption")

_NONCE_SIZE = 12  # 96-bit nonce recommended for AES-GCM


class EncryptionService:
    """AES-256-GCM authenticated encryption.

    Each encryption generates a unique nonce.
    Wire format: nonce (12 bytes) || ciphertext+tag (variable).
    """

    def __init__(self, key: str | bytes):
        if isinstance(key, str):
            # Accept base64-encoded or raw hex keys
            try:
                raw = base64.urlsafe_b64decode(key + "==")
            except Exception:
                raw = bytes.fromhex(key) if len(key) >= 64 else key.encode()[:32]
            self._key = raw[:32]
        else:
            self._key = key[:32]

        if len(self._key) < 16:
            raise EncryptionError("Encryption key must be at least 16 bytes")
        # Pad to 32 bytes if shorter (AES-256 requires 32)
        self._key = self._key.ljust(32, b"\x00")
        self._aesgcm = AESGCM(self._key)

    # ── Core ops ─────────────────────────────────────────
    def encrypt(self, plaintext: bytes) -> bytes:
        """Encrypt plaintext → nonce + ciphertext (includes GCM tag)."""
        nonce = os.urandom(_NONCE_SIZE)
        ct = self._aesgcm.encrypt(nonce, plaintext, None)
        return nonce + ct

    def decrypt(self, data: bytes) -> bytes:
        """Decrypt nonce+ciphertext → plaintext. Raises on tamper."""
        if len(data) < _NONCE_SIZE + 16:
            raise EncryptionError("Ciphertext too short")
        nonce = data[:_NONCE_SIZE]
        ct = data[_NONCE_SIZE:]
        try:
            return self._aesgcm.decrypt(nonce, ct, None)
        except Exception as exc:
            raise EncryptionError(f"Decryption failed: {exc}") from exc

    # ── File ops ─────────────────────────────────────────
    def encrypt_file(self, file_path: Path) -> Path:
        """Encrypt a file in-place; returns path with .enc suffix."""
        plaintext = file_path.read_bytes()
        encrypted = self.encrypt(plaintext)
        enc_path = file_path.with_suffix(file_path.suffix + ".enc")
        enc_path.write_bytes(encrypted)
        # Securely overwrite original
        file_path.write_bytes(b"\x00" * len(plaintext))
        file_path.unlink()
        log.info("file_encrypted", path=str(enc_path), size=len(encrypted))
        return enc_path

    def decrypt_file(self, enc_path: Path) -> bytes:
        """Decrypt .enc file, return plaintext bytes."""
        data = enc_path.read_bytes()
        return self.decrypt(data)

    # ── Helpers ──────────────────────────────────────────
    @staticmethod
    def generate_key() -> str:
        """Generate a new random 32-byte key, base64-encoded."""
        return base64.urlsafe_b64encode(os.urandom(32)).decode()
