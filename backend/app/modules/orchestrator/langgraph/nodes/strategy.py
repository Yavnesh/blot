from typing import Dict, Any, List
from loguru import logger
from app.modules.orchestrator.langgraph.state import ArticleState
from app.agents.strategy.keyword_cluster_agent import KeywordClusterAgent
from app.agents.strategy.intent_agent import IntentAgent

async def strategy_node(state: ArticleState) -> Dict[str, Any]:
    """
    Generates SEO keyword clusters and a structured SERP blueprint or Instagram strategy.
    """
    logger.info(f"LangGraph [Strategy]: Building Strategy for '{state['resolved_topic']}' ({state.get('pipeline_type', 'blog')})")
    
    if not state.get("serp_data"):
        return {
            "serp_data": [],
            "logs": ["No research data available for strategy development. Skipping."]
        }
        
    if state.get("pipeline_type") == "instagram":
        from app.agents.strategy.instagram_strategy_agent import InstagramStrategyAgent
        agent = InstagramStrategyAgent()
        result = await agent.run({
            "topic": state["resolved_topic"],
            "verified_research": state.get("serp_data", []),
            "tone": state.get("tone", "educational"),
            "audience": state.get("audience", "developers"),
            "instagram_format": state.get("instagram_format", "carousel"),
            "target_audience_taxonomy": state.get("target_audience_taxonomy"),
            "editorial_tone_taxonomy": state.get("editorial_tone_taxonomy")
        })
        if result.status != "success":
            return {"logs": [f"Instagram strategy formulation failed: {result.feedback}"]}
        
        strat_data = result.data.get("strategy", {})
        return {
            "brand_voice_prompt": strat_data.get("visual_style"),
            "serp_blueprint": strat_data,
            "logs": [
                f"Instagram Strategy established. Angle: '{strat_data.get('angle')}'",
                f"Hook: '{strat_data.get('hook')}'"
            ]
        }

    # 1. Keyword Clustering
    cluster_agent = KeywordClusterAgent()

    cluster_result = await cluster_agent.run({
        "topic": state["resolved_topic"],
        "verified_research": state.get("serp_data", [])
    })
    
    if cluster_result.status != "success":
        return {"logs": [f"Keyword clustering failed: {cluster_result.feedback}"]}
        
    cluster_data = cluster_result.data
    
    # 2. Intent & Blueprint Generation
    intent_agent = IntentAgent()
    # Merge cluster data into intent input
    intent_input = {
        "verified_research": state.get("serp_data", []),
        "topic": state["resolved_topic"],
        "target_audience": "Digital Marketing Professionals", # Default or from state
        **cluster_data
    }
    
    intent_result = await intent_agent.run(intent_input)
    
    if intent_result.status != "success":
        return {"logs": [f"Intent blueprinting failed: {intent_result.feedback}"]}
        
    blueprint_data = intent_result.data
    
    return {
        "primary_keyword": cluster_data.get("primary_keyword"),
        "keyword_clusters": cluster_data.get("long_tail_keywords", []),
        "search_intent": cluster_data.get("search_intent"),
        "brand_voice_prompt": blueprint_data.get("serp_blueprint", {}).get("tone_guide"),
        "logs": [
            f"SEO Strategy established. Primary Keyword: '{cluster_data.get('primary_keyword')}'",
            f"Blueprint generated with {len(blueprint_data.get('serp_blueprint', {}).get('heading_skeleton', []))} structural headings."
        ],
        "serp_blueprint": blueprint_data.get("serp_blueprint") # Helper for Writing Node
    }
