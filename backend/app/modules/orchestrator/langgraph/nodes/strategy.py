from typing import Dict, Any, List
from loguru import logger
from app.modules.orchestrator.langgraph.state import ArticleState
from app.agents.strategy.keyword_cluster_agent import KeywordClusterAgent
from app.agents.strategy.intent_agent import IntentAgent

async def strategy_node(state: ArticleState) -> Dict[str, Any]:
    """
    Generates SEO keyword clusters and a structured SERP blueprint.
    """
    logger.info(f"LangGraph [Strategy]: Building SEO Blueprint for '{state['resolved_topic']}'")
    
    if not state.get("serp_data"):
        return {
            "serp_data": [],
            "logs": ["No research data available for strategy development. Skipping."]
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
