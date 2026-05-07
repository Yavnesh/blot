import os
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "blot_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        'app.modules.orchestrator.service.pipeline_tasks',
        'app.tasks.rag_tasks'
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_track_started=True,
    task_time_limit=3600,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    # Queue Separation
    task_routes={
        "blot.orchestrator.*": {"queue": "heavy"},
        "blot.rag.*": {"queue": "default"},
    },
    task_default_queue="default",
)

