"""Celery application configuration."""

from celery import Celery
from config import settings

celery_app = Celery(
    "legalsaathi",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 min hard limit
    task_soft_time_limit=180,  # 3 min soft limit
    worker_max_tasks_per_child=50,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "scheduled-wipe": {
            "task": "app.tasks.wipe_task.scheduled_wipe",
            "schedule": 900.0,  # Every 15 minutes
        },
    },
)
