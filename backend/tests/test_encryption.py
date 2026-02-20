"""Tests for encryption service."""

import os
import pytest
from pathlib import Path

from app.security.encryption import EncryptionService
from app.utils.exceptions import EncryptionError


class TestEncryption:
    def setup_method(self):
        self.key = EncryptionService.generate_key()
        self.svc = EncryptionService(self.key)

    def test_encrypt_decrypt_roundtrip(self):
        plaintext = b"This is a secret legal document."
        encrypted = self.svc.encrypt(plaintext)
        decrypted = self.svc.decrypt(encrypted)
        assert decrypted == plaintext

    def test_different_nonces_each_encryption(self):
        plaintext = b"Same text encrypted twice"
        enc1 = self.svc.encrypt(plaintext)
        enc2 = self.svc.encrypt(plaintext)
        assert enc1 != enc2  # Different nonces = different ciphertext
        assert self.svc.decrypt(enc1) == plaintext
        assert self.svc.decrypt(enc2) == plaintext

    def test_tampered_ciphertext_raises(self):
        plaintext = b"Sensitive data"
        encrypted = self.svc.encrypt(plaintext)
        tampered = encrypted[:-1] + bytes([encrypted[-1] ^ 0xFF])
        with pytest.raises(EncryptionError):
            self.svc.decrypt(tampered)

    def test_short_data_raises(self):
        with pytest.raises(EncryptionError):
            self.svc.decrypt(b"short")

    def test_file_encryption_decryption(self, tmp_path):
        test_file = tmp_path / "contract.txt"
        content = b"RENTAL AGREEMENT: Security deposit shall be 2 months."
        test_file.write_bytes(content)

        enc_path = self.svc.encrypt_file(test_file)
        assert enc_path.exists()
        assert not test_file.exists()  # Original deleted

        decrypted = self.svc.decrypt_file(enc_path)
        assert decrypted == content

    def test_generate_key_is_unique(self):
        k1 = EncryptionService.generate_key()
        k2 = EncryptionService.generate_key()
        assert k1 != k2

    def test_empty_plaintext(self):
        encrypted = self.svc.encrypt(b"")
        decrypted = self.svc.decrypt(encrypted)
        assert decrypted == b""

    def test_large_plaintext(self):
        plaintext = os.urandom(10 * 1024 * 1024)  # 10MB
        encrypted = self.svc.encrypt(plaintext)
        decrypted = self.svc.decrypt(encrypted)
        assert decrypted == plaintext
