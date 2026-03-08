import asyncio
from app.core.celery_app import celery_app
from app.modules.orchestrator.service.pipeline_engine import DeterministicPipelineEngine
from loguru import logger

@celery_app.task(bind=True, name="tews.orchestrator.execute_seo_pipeline", max_retries=3)
def execute_seo_pipeline_task(self, job_id: str, initial_state: dict):
    """
    Celery background worker task for running the autonomous SEO pipeline.
    Replaces FastAPI BackgroundTasks for robust queue management.
    """
    logger.info(f"Celery Worker picked up Job ID: {job_id}")
    engine = DeterministicPipelineEngine(job_id=job_id)
    
    try:
        # Run the async pipeline engine inside the synchronous celery worker
        result = asyncio.run(engine.execute_full_pipeline(initial_state.copy()))
        logger.info(f"Celery Task Completed for Job ID {job_id}. Cost: ${sum(t['cost'] for t in result['telemetry']):.4f}")
        return result
    except Exception as exc:
        logger.error(f"Celery Task Failed for Job ID {job_id}: {exc}")
        # Automatically retry the entire pipeline block if it crashes unexpectedly
        raise self.retry(exc=exc, countdown=60)
