import asyncio
from app.core.celery_app import celery_app
from loguru import logger


@celery_app.task(bind=True, name="blot.rag.process_asset", max_retries=3, queue="heavy")
def process_workspace_asset_task(self, asset_id: int):
    """
    Celery background worker task for parsing and vectorizing workspace assets.
    Enables long-running PDF/Docx processing without blocking the API response.
    """
    logger.info(f"Celery Worker starting vectorization for Asset ID: {asset_id}")

    from app.db.session import get_db_session
    from app.models.rag import WorkspaceAsset

    with get_db_session() as db:
        asset = db.query(WorkspaceAsset).get(asset_id)

        if not asset:
            logger.error(f"Asset {asset_id} not found in DB inside worker task.")
            return

        try:
            # Load file bytes from storage (assuming local path for MVP, can be S3)
            with open(asset.s3_path, "rb") as f:
                file_bytes = f.read()

            from app.services.rag_service import process_and_embed_asset

            # Run the async embedding logic within the sync Celery thread
            asyncio.run(process_and_embed_asset(db, asset.id, file_bytes, asset.file_type))

            logger.success(f"Finalized vectorization for Asset {asset_id}")
            # Commit is handled by the context manager on success

        except Exception as exc:
            logger.error(f"Asset Processing Task Failed for Asset {asset_id}: {exc}")
            asset.status = "error"
            db.commit()  # Persist error status before retrying
            raise self.retry(exc=exc, countdown=60)
