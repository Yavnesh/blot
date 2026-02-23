import json
import asyncio
from typing import List, Optional
from sqlalchemy.orm import Session
from loguru import logger
from pytrends.request import TrendReq
from gnews import GNews
import newspaper
from newspaper import Config as NewspaperConfig

from app.models.trending import Trending
from app.models.scrape import Scrape
from app.models.post import Post
from app.core.clients import genai_client, horde_client, twitter_client

from app.agents.core.editorial_orchestrator import EditorialOrchestrator

class BlogGeneratorService:
    def __init__(self, db: Session):
        self.db = db
        self.orchestrator = EditorialOrchestrator()

    async def run_full_pipeline(self, limit: int = 1, topic_id: Optional[int] = None, user_topic: Optional[str] = None, task_id: Optional[str] = None, include_images: bool = True):
        logger.info(f"Starting Agentic Editorial Pipeline (Task: {task_id})")
        try:
            for _ in range(limit):
                content = await self.orchestrator.run_editorial_workflow(
                    self.db, 
                    topic_id=topic_id, 
                    user_topic=user_topic,
                    task_id=task_id,
                    include_images=include_images
                )
                if content:
                    logger.success(f"Generated article: {content.get('title')}")
                else:
                    logger.warning("Agentic workflow did not produce content.")
        except Exception as e:
            logger.error(f"Error in integrated agentic pipeline: {e}")
        except Exception as e:
            logger.error(f"Error in integrated agentic pipeline: {e}")

    # Keeping old methods as internal utilities or for migration reference
    def fetch_trends(self) -> List[str]:
        # Now handled by TrendAgent inside orchestrator
        pass

    def scrape_topic(self, trending_id: int):
        # Now handled by AggregatorAgent inside orchestrator
        pass

    async def generate_post(self, scrape_id: int):
        # Now handled by DraftAgent and others inside orchestrator
        pass
