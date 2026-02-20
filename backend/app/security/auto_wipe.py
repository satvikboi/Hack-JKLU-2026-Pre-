"""Three-trigger auto-wipe system for session data."""

from __future__ import annotations

import shutil
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

import redis.asyncio as aioredis

from config import settings
from app.security.session_manager import SessionManager
from app.utils.helpers import secure_delete, utcnow, generate_id
from app.utils.logger import get_logger
from app.utils import metrics as m

log = get_logger("auto_wipe")


@dataclass
class WipeReport:
    session_id: str
    files_deleted: int = 0
    vectors_deleted: bool = False
    redis_keys_deleted: int = 0
    timestamp: datetime = field(default_factory=utcnow)


class AutoWipeService:
    """Three-trigger deletion: TTL expiry, manual trigger, scheduled sweep."""

    def __init__(self, session_manager: SessionManager, chroma_client=None):
        self.session_mgr = session_manager
        self.chroma = chroma_client

    async def wipe_session_data(self, session_id: str) -> WipeReport:
        """Execute full data wipe for a session."""
        report = WipeReport(session_id=session_id)

        # 1. Delete ChromaDB collection
        if self.chroma:
            collection_name = f"session_{session_id}"
            try:
                self.chroma.delete_collection(name=collection_name)
                report.vectors_deleted = True
                log.info("chromadb_collection_deleted", collection=collection_name)
            except Exception:
                log.debug("chromadb_collection_not_found", collection=collection_name)

        # 2. Delete upload files (secure overwrite + delete)
        upload_dir = Path(settings.TEMP_UPLOAD_DIR) / session_id
        report.files_deleted += self._secure_delete_dir(upload_dir)

        # 3. Delete audio files
        audio_dir = Path(settings.TEMP_AUDIO_DIR) / session_id
        report.files_deleted += self._secure_delete_dir(audio_dir)

        # 4. Invalidate session in Redis
        redis_result = await self.session_mgr.invalidate_session(session_id)
        report.redis_keys_deleted = redis_result.get("redis_keys_deleted", 0)

        log.info(
            "session_wiped",
            session_id=session_id[:8],
            files=report.files_deleted,
            vectors=report.vectors_deleted,
        )
        return report

    def _secure_delete_dir(self, dir_path: Path) -> int:
        """Securely delete all files in a directory, then remove the directory."""
        if not dir_path.exists():
            return 0
        count = 0
        for f in dir_path.rglob("*"):
            if f.is_file():
                secure_delete(f)
                count += 1
        # Remove empty dirs
        if dir_path.exists():
            shutil.rmtree(dir_path, ignore_errors=True)
        return count

    async def scheduled_sweep(self) -> int:
        """Run periodic sweep to find and wipe any orphaned sessions."""
        redis: aioredis.Redis = self.session_mgr.redis
        wiped = 0
        # Check all session-related temp directories
        upload_base = Path(settings.TEMP_UPLOAD_DIR)
        if upload_base.exists():
            for session_dir in upload_base.iterdir():
                if session_dir.is_dir():
                    sid = session_dir.name
                    session = await self.session_mgr.get_session(sid)
                    if session is None:  # Session expired in Redis
                        await self.wipe_session_data(sid)
                        wiped += 1

        if wiped:
            log.info("scheduled_sweep_complete", sessions_wiped=wiped)
        return wiped
