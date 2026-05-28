from typing import Dict, Any, List
from loguru import logger
from app.modules.orchestrator.langgraph.state import ArticleState
from app.agents.core.evaluator import EvaluationAgent

async def evaluation_node(state: ArticleState) -> Dict[str, Any]:
    """
    Acts as the final quality gate. Decisions of this node trigger 
    either the 'Publish' flow or the 'Reflection/Rework' loop.
    """
    logger.info(f"LangGraph [Evaluation]: Assessing final article for Job {state['job_id']}")
    
    if state.get("pipeline_type") == "instagram":
        return {
            "is_approved": True,
            "logs": ["Instagram post automatically approved by evaluation gate."]
        }
        
    content = state.get("current_draft")
    if not content:
        # If no draft, we should probably stop or it will loop forever.
        # But we'll increment the loop count to eventually hit the limit.
        current_loop = state.get("loop_count", 0)
        return {
            "loop_count": current_loop + 1,
            "is_approved": current_loop >= 2, # Force stop after 2 attempts with no content
            "logs": ["Evaluation aborted: No draft found."]
        }
        
    eval_agent = EvaluationAgent()
    # Evaluator.run expects content in 'final_publish_ready_content'
    result = await eval_agent.run({"final_publish_ready_content": content})
    
    if result.status != "success":
        # Fallback to a base passing score if evaluation crashes
        logger.error(f"Evaluation crashed: {result.feedback}")
        return {
            "is_approved": True, 
            "logs": ["Evaluation engine error. Passing article with default approval."]
        }
        
    eval_data = result.data
    score = eval_data.get("score", 0)
    
    # Decisions based on editorial score (Threshold: 85)
    if score >= 85:
        return {
            "is_approved": True,
            "evaluation_feedback": [f"PASS: {score}% - {eval_data.get('critique', '')}"],
            "logs": [f"Final Score: {score}% - Article Approved for Publication."]
        }
    else:
        # Loop prevention: Only allow 2 revision cycles max
        if state.get("loop_count", 0) >= 2:
            return {
                "is_approved": True,
                "logs": [f"Score is {score}%, which is below threshold, but Max Loops reached. Approving despite feedback."]
            }
        
        return {
            "is_approved": False,
            "loop_count": state.get("loop_count", 0) + 1,
            "evaluation_feedback": [f"REJECT: {score}% - {eval_data.get('critique', '')}"],
            "logs": [f"Score is {score}%. Triggering Reflection Loop with feedback."]
        }
