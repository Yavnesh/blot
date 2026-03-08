import asyncio
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from loguru import logger

from app.models.post import Post
from app.modules.orchestrator.service.pipeline_engine import DeterministicPipelineEngine

class AgentService:
    @staticmethod
    async def rerun_agent_for_post(db: Session, post_id: int, agent_key: str) -> Dict[str, Any]:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise ValueError("Post not found")
        
        # Reconstruct state from existing post
        # This is a best-effort reconstruction
        state = {
            "topic": post.title[0] if isinstance(post.title, list) and post.title else "Article",
            "final_draft": post.content[0] if isinstance(post.content, list) and post.content else "",
            "research_data": post.research_sources or [],
            "seo_data": post.seo_data or {},
            "include_images": False # Default for individual reruns
        }
        
        # Merge existing SEO data into state for agents that need it (like readability/seo refinements)
        if post.seo_data:
            state.update(post.seo_data)
            
        # Initialize engine to get access to agents
        # We don't use execute_full_pipeline, just run_stage
        engine = DeterministicPipelineEngine(job_id=f"rerun-{post_id}-{agent_key}")
        
        # Run the specific agent
        # We use run_stage to handle logging and retries
        try:
            # We need to map agent_key to a display name if we want pretty logs
            result_data = await engine.run_stage(agent_key, f"Rerun {agent_key}", state, db=db)
            return {
                "status": "success",
                "new_data": result_data,
                "original_data": AgentService._get_original_data_for_agent(post, agent_key)
            }
        except Exception as e:
            logger.error(f"Rerun failed: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

    @staticmethod
    def _get_original_data_for_agent(post: Post, agent_key: str) -> Any:
        """Extract existing data that this agent usually produces."""
        if agent_key == "seo":
            return post.seo_data
        elif agent_key == "draft" or agent_key == "voice":
            return post.content[0] if post.content else ""
        elif agent_key == "evaluator":
            return post.meta # stored critique
        # Default fallback
        return None
