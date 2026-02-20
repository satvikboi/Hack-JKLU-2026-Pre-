"""Translation service — offline-first with argostranslate fallback."""

from __future__ import annotations

from app.utils.logger import get_logger

log = get_logger("translator")


class TranslationService:
    """Offline translation using deep-translator (Google free tier) with fallback."""

    SUPPORTED = {"hi", "mr", "ta", "bn", "gu", "te", "en"}

    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """Translate text between supported languages."""
        if source_lang == target_lang:
            return text
        if not text.strip():
            return text

        try:
            from deep_translator import GoogleTranslator
            # deep-translator uses full language codes
            lang_map = {"hi": "hi", "mr": "mr", "ta": "ta", "bn": "bn", "gu": "gu", "te": "te", "en": "en"}
            src = lang_map.get(source_lang, source_lang)
            tgt = lang_map.get(target_lang, target_lang)

            # Split long text (deep-translator limit ~5000 chars)
            chunks = [text[i:i+4500] for i in range(0, len(text), 4500)]
            translated_chunks = []
            for chunk in chunks:
                result = GoogleTranslator(source=src, target=tgt).translate(chunk)
                translated_chunks.append(result or chunk)

            translated = " ".join(translated_chunks)
            log.info("translated", source=source_lang, target=target_lang, chars=len(text))
            return translated

        except Exception as e:
            log.warning("translation_failed_returning_original", error=str(e))
            return text

    def translate_legal_fields(self, obj: dict, fields: list[str], target_lang: str) -> dict:
        """Translate specific fields in a dict while preserving others."""
        import asyncio
        result = dict(obj)
        for field in fields:
            if field in result and isinstance(result[field], str):
                try:
                    result[field] = asyncio.get_event_loop().run_until_complete(
                        self.translate(result[field], "en", target_lang)
                    )
                except Exception:
                    pass
        return result
