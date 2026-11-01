from typing import Dict, Any
from sqlalchemy.orm import Session
from loguru import logger

from app.models.post import Post


class AgentService:
    @staticmethod
    async def rerun_agent_for_post(db: Session, post_id: int, agent_key: str, org_id: int) -> Dict[str, Any]:
        """
        Re-run a specific agent for an existing post.
        
        TODO: Reimplement using LangGraph single-node execution.
        The previous implementation used the now-deleted DeterministicPipelineEngine.
        This should be refactored to compile a single-node LangGraph subgraph
        and invoke it with reconstructed state from the post.
        """
        raise NotImplementedError(
            "Agent rerun via LangGraph is pending implementation. "
            "The legacy DeterministicPipelineEngine has been removed."
        )

    @staticmethod
    def _get_original_data_for_agent(post: Post, agent_key: str) -> Any:
        """Extract existing data that this agent usually produces."""
        if agent_key == "seo":
            return post.seo_data
        elif agent_key == "draft" or agent_key == "voice":
            return post.content[0] if post.content else ""
        elif agent_key == "evaluator":
            return post.meta  # stored critique
        # Default fallback
        return None
