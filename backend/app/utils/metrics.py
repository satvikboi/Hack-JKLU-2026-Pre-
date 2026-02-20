"""Prometheus metrics for LegalSaathi."""

from __future__ import annotations

from prometheus_client import Counter, Gauge, Histogram

# ── Counters ─────────────────────────────────────────────
ANALYSES_TOTAL = Counter(
    "legalsaathi_analyses_total",
    "Total contract analyses performed",
    ["contract_type", "language", "risk_level"],
)
SESSIONS_CREATED = Counter("legalsaathi_sessions_created_total", "Total sessions created")
SESSIONS_WIPED = Counter("legalsaathi_sessions_wiped_total", "Total sessions wiped")
FILES_PROCESSED = Counter("legalsaathi_files_processed_total", "Files processed", ["mime_type"])
VOICE_QUERIES = Counter("legalsaathi_voice_queries_total", "Voice queries", ["language"])

# ── Histograms ───────────────────────────────────────────
ANALYSIS_DURATION = Histogram(
    "legalsaathi_analysis_duration_seconds",
    "Time to complete full analysis",
    buckets=[1, 5, 10, 30, 60, 120, 300],
)
INFERENCE_DURATION = Histogram(
    "legalsaathi_inference_duration_seconds",
    "Time for single Ollama inference call",
    buckets=[0.5, 1, 2, 5, 10, 30, 60],
)
EMBEDDING_DURATION = Histogram(
    "legalsaathi_embedding_duration_seconds",
    "Time for embedding batch",
    buckets=[0.1, 0.5, 1, 2, 5, 10],
)

# ── Gauges ───────────────────────────────────────────────
ACTIVE_SESSIONS = Gauge("legalsaathi_active_sessions", "Currently active sessions")
CHROMA_COLLECTIONS = Gauge("legalsaathi_chromadb_collections", "Active ChromaDB collections")
TEMP_FILES_ON_DISK = Gauge("legalsaathi_temp_files_on_disk", "Temp files currently on disk")
