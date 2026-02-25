import json
import asyncio
from typing import List, Optional
from sqlalchemy.orm import Session
from loguru import logger

from app.models.trending import Trending
from app.models.scrape import Scrape
from app.models.post import Post

from app.agents.core.editorial_orchestrator import EditorialOrchestrator


class BlogGeneratorService:
    def __init__(self, db: Session):
        self.db = db

    async def run_full_pipeline(
        self,
        limit: int = 1,
        topic_id: Optional[int] = None,
        user_topic: Optional[str] = None,
        post_id: Optional[int] = None,
        task_id: Optional[str] = None,
        include_images: bool = True,
        reuse_scrape: bool = False
    ):
        logger.info(f"Starting Agentic Editorial Pipeline (Task: {task_id})")

        # If post_id provided, resolve the topic from the existing post
        if post_id and not user_topic:
            existing_post = self.db.query(Post).filter(Post.id == post_id).first()
            if existing_post and existing_post.title:
                user_topic = existing_post.title[0] if isinstance(existing_post.title, list) else existing_post.title
                logger.info(f"RetryPipeline: Re-running for post #{post_id} → topic='{user_topic}'")

        try:
            for _ in range(limit):
                # IMPORTANT: Create a fresh orchestrator per run to guarantee state isolation.
                # This means parallel triggers from 2 users will not share any state.
                orchestrator = EditorialOrchestrator()

                content = await orchestrator.run_editorial_workflow(
                    self.db,
                    topic_id=topic_id,
                    user_topic=user_topic,
                    task_id=task_id,
                    include_images=include_images,
                    reuse_scrape=reuse_scrape
                )
                if content:
                    logger.success(f"Generated article: {content.get('title')}")
                else:
                    logger.warning("Agentic workflow did not produce content.")
        except Exception as e:
            logger.error(f"Error in integrated agentic pipeline: {e}")
            # Mark task as error in DB
            try:
                from app.models.task_progress import TaskProgress
                progress = self.db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
                if progress:
                    progress.status = "error"
                    self.db.commit()
            except Exception:
                pass
