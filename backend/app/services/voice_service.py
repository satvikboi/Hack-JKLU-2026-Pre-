"""Voice service — STT with faster-whisper, TTS placeholder."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from config import settings
from app.utils.helpers import ensure_dir, generate_id
from app.utils.logger import get_logger

log = get_logger("voice")


class TranscriptionResult:
    def __init__(self, text: str, language: str, confidence: float = 0.0):
        self.text = text
        self.language = language
        self.confidence = confidence


class VoiceService:
    """Voice pipeline — STT (faster-whisper) + TTS (placeholder)."""

    def __init__(self):
        self._whisper_model = None

    def _load_whisper(self):
        """Load faster-whisper model."""
        try:
            from faster_whisper import WhisperModel
            self._whisper_model = WhisperModel(
                settings.WHISPER_MODEL,
                device=settings.WHISPER_DEVICE,
                compute_type="int8" if settings.WHISPER_DEVICE == "cpu" else "float16",
            )
            log.info("whisper_model_loaded", model=settings.WHISPER_MODEL)
        except Exception as e:
            log.error("whisper_load_failed", error=str(e))

    async def transcribe(self, audio_path: Path, hint_language: Optional[str] = None) -> TranscriptionResult:
        """Transcribe audio to text using faster-whisper."""
        if self._whisper_model is None:
            self._load_whisper()

        if self._whisper_model is None:
            raise RuntimeError("Whisper model not available")

        segments, info = self._whisper_model.transcribe(
            str(audio_path),
            language=hint_language,
            beam_size=5,
        )

        text_parts = [seg.text for seg in segments]
        text = " ".join(text_parts).strip()

        result = TranscriptionResult(
            text=text,
            language=info.language or hint_language or "en",
            confidence=info.language_probability or 0.0,
        )

        log.info("transcription_complete", lang=result.language, chars=len(text))
        return result

    async def synthesize(self, text: str, language: str, session_id: str) -> Path:
        """TTS synthesis placeholder — returns a dummy path."""
        audio_dir = ensure_dir(Path(settings.TEMP_AUDIO_DIR) / session_id)
        output_path = audio_dir / f"{generate_id()}.mp3"

        # Placeholder: In production, use Coqui XTTS-v2
        log.info("tts_synthesis_placeholder", lang=language, chars=len(text))

        # Write a placeholder audio file (silent)
        output_path.write_bytes(b"\x00" * 1024)
        return output_path

    async def process_voice_query(
        self,
        audio_path: Path,
        session_id: str,
        rag_pipeline=None,
        hint_language: Optional[str] = None,
    ) -> dict:
        """Full voice pipeline: transcribe → query → respond."""
        # 1. Transcribe
        transcript = await self.transcribe(audio_path, hint_language)

        # 2. Query RAG if available
        answer = "Voice query processing is available when a contract is uploaded."
        if rag_pipeline:
            sys_prompt = (
                "You are LegalSaathi, a helpful Indian legal AI. "
                "Answer the user's question about their contract in simple, clear language. "
                f"Respond in {transcript.language}."
            )
            answer = await rag_pipeline.query(
                session_id=session_id,
                question=transcript.text,
                system_prompt=sys_prompt,
            )

        # 3. TTS
        audio_path_out = await self.synthesize(answer, transcript.language, session_id)

        return {
            "transcript": transcript.text,
            "detected_language": transcript.language,
            "answer_text": answer,
            "audio_url": f"/api/v1/audio/{session_id}/{audio_path_out.name}",
            "audio_expires_in": 600,
        }
