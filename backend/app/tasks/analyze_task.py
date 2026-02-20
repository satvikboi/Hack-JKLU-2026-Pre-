"""Async analysis task for Celery workers."""

from app.tasks.celery_app import celery_app
from app.utils.logger import get_logger

log = get_logger("analyze_task")


@celery_app.task(bind=True, max_retries=3, soft_time_limit=180, rate_limit="10/m")
def run_analysis_task(self, session_id: str, file_path: str, config: dict):
    """Run full analysis pipeline in background worker."""
    import asyncio
    from pathlib import Path
    import redis

    from config import settings

    r = redis.from_url(settings.REDIS_URL, decode_responses=True)

    try:
        # Update progress
        r.set(f"task:{self.request.id}:progress", "25")

        from app.services.document_parser import DocumentParser
        from app.services.embedder import EmbeddingService
        from app.services.vector_store import VectorStore
        from app.services.ollama_client import OllamaClient
        from app.services.rag_pipeline import RAGPipeline
        from app.services.blindspot_analyzer import BlindspotAnalyzer
        from app.services.risk_scorer import RiskScorer

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        parser = DocumentParser()
        mime_type = config.get("mime_type", "application/pdf")
        parsed_doc = loop.run_until_complete(parser.parse(Path(file_path), mime_type))

        r.set(f"task:{self.request.id}:progress", "50")

        embedder = EmbeddingService()
        vs = VectorStore()
        ollama = OllamaClient()
        rag = RAGPipeline(vs, embedder, ollama)

        loop.run_until_complete(rag.ingest_document(session_id, parsed_doc))

        r.set(f"task:{self.request.id}:progress", "75")

        contract_type = config.get("contract_type") or parser.detect_contract_type(parsed_doc.text)
        language = config.get("language", "en")

        blindspot = BlindspotAnalyzer(rag)
        scorer = RiskScorer(rag, blindspot)
        result = loop.run_until_complete(scorer.score(session_id, contract_type, language))

        r.set(f"task:{self.request.id}:progress", "100")

        result_dict = result.model_dump(mode="json")
        import json
        r.setex(f"task:{self.request.id}:result", settings.SESSION_TTL_SECONDS, json.dumps(result_dict))

        loop.close()
        log.info("async_analysis_complete", task_id=self.request.id, session_id=session_id[:8])
        return result_dict

    except Exception as exc:
        log.error("async_analysis_failed", task_id=self.request.id, error=str(exc))
        r.set(f"task:{self.request.id}:progress", "failed")
        raise self.retry(exc=exc, countdown=30)
