from typing import Dict, Any, List
from loguru import logger
from app.modules.orchestrator.langgraph.state import ArticleState
from app.agents.writing.image_agent import ImageAgent

async def image_node(state: ArticleState) -> Dict[str, Any]:
    """
    Generates visual assets (cover image and gallery) for the article.
    Integrated into the LangGraph workflow.
    """
    if not state.get("include_images", True):
        return {"logs": ["Visual asset generation skipped by user preference."]}
        
    logger.info(f"LangGraph [Image]: Synthesizing visual matrix for Job {state['job_id']}")
    
    agent = ImageAgent()
    input_data = {
        "final_draft": state.get("current_draft"),
        "topic": state.get("resolved_topic"),
        "image_provider": state.get("image_provider", "google"),
        "seo_data": state.get("seo_pack")
    }
    
    result = await agent.run(input_data)
    
    if result.status == "success":
        images = result.data.get("all_images", [])
        cover = result.data.get("cover_image", {})
        return {
            "all_images": images,
            "cover_image": cover,
            "logs": [f"Visual synthesis complete. {len(images)} assets generated via {state.get('image_provider', 'default')}."]
        }
        
    return {"logs": [f"Visual agent issue: {result.feedback}"]}
