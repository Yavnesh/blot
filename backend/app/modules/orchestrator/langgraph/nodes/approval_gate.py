from typing import Dict, Any
from loguru import logger
from app.modules.orchestrator.langgraph.state import ArticleState

async def approval_gate_node(state: ArticleState) -> Dict[str, Any]:
    """
    The Human-in-the-Loop (HITL) node. 
    This node does nothing programmatically; it acts as a passive placeholder.
    We configure the graph to INTERRUPT before this node, allowing a human 
    to set 'human_approved' and 'human_feedback' before resuming.
    """
    logger.info(f"LangGraph [HITL]: Awaiting human authorization for Job {state['job_id']}")
    
    # If we reached here without an interrupt, or we are resuming:
    if state.get("human_approved"):
        return {
            "logs": ["Human Verification: SUCCESS. Article cleared for publication."]
        }
    else:
        # This branch might be reached if the graph is resumed but not approved (rejected)
        # We handle the 'rejected' case in the conditional edge logic.
        return {
            "logs": ["Human Verification: PENDING or REJECTED. Awaiting manual override."]
        }
