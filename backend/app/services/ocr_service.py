"""OCR service — EasyOCR for scanned documents."""

from __future__ import annotations

from pathlib import Path
from typing import Optional, List

from app.utils.logger import get_logger

log = get_logger("ocr")


class OCRService:
    """EasyOCR wrapper for Indian-language scanned document processing."""

    def __init__(self, languages: Optional[List[str]] = None):
        self.languages = languages or ["en", "hi"]
        self._reader = None

    def _load_reader(self):
        try:
            import easyocr
            self._reader = easyocr.Reader(self.languages, gpu=False)
            log.info("ocr_reader_loaded", languages=self.languages)
        except Exception as e:
            log.error("ocr_reader_load_failed", error=str(e))

    async def extract_text(self, image_path: Path) -> str:
        """Extract text from image using EasyOCR."""
        if self._reader is None:
            self._load_reader()

        if self._reader is None:
            raise RuntimeError("OCR reader not available")

        results = self._reader.readtext(str(image_path))
        text = "\n".join([r[1] for r in results])
        log.info("ocr_extracted", path=str(image_path), chars=len(text))
        return text
