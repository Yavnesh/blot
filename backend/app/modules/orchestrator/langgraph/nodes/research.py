from typing import Dict, Any, List
from loguru import logger
from app.modules.orchestrator.langgraph.state import ArticleState
from app.agents.intelligence.trend_agent import TrendAgent
from app.agents.research.aggregator_agent import AggregatorAgent
from app.agents.research.credibility_agent import CredibilityAgent
from app.db.session import SessionLocal

async def discovery_node(state: ArticleState) -> Dict[str, Any]:
    """
    Resolves the editorial topic if not provided.
    """
    logger.info(f"LangGraph [Discovery]: Resolving topic for Job {state['job_id']}")
    
    if state.get("user_topic"):
        return {"resolved_topic": state["user_topic"], "logs": ["Topic provided by user. Skipping auto-discovery."]}
    
    agent = TrendAgent()
    # TrendAgent.run returns AgentOutput. In the previous engine it was called with {}
    result = await agent.run({"db_bypass": True})
    
    if result.status == "success":
        topic = result.data.get("trends", [{}])[0].get("topic", "Technology Trends")
        return {
            "resolved_topic": topic,
            "logs": [f"Auto-discovered trending topic: {topic}"]
        }
    
    return {"resolved_topic": "General Technology", "logs": ["Discovery failed, falling back to General Technology."]}

async def research_node(state: ArticleState) -> Dict[str, Any]:
    """
    Orchestrates intelligence gathering from External Web (Aggregator) and Internal RAG (Knowledge Vault).
    """
    mode = state.get("research_mode", "hybrid")
    logger.info(f"LangGraph [Research]: Strategy='{mode}' for topic '{state['resolved_topic']}'")
    
    db = SessionLocal()
    external_research = []
    internal_findings = []
    
    try:
        # 1. EXTERNAL AGGREGATOR (WEB SEARCH)
        # Skip if mode is purely 'vault'
        if mode in ["web", "hybrid"]:
            logger.info("LangGraph [Research]: Triggering External Aggregator Agent")
            agent = AggregatorAgent()
            input_data = {
                "db": db,
                "org_id": state.get("org_id"),
                "trending_id": state.get("topic_id"),
                "user_topic": state.get("resolved_topic"),
                "reuse_scrape": state.get("reuse_scrape", False)
            }
            result = await agent.run(input_data)
            if result.status == "success":
                external_research = result.data.get("research_data", [])
            else:
                logger.warning(f"External Aggregator yielded no results: {result.feedback}")

        # 2. INTERNAL RAG (ORGANIZATION KNOWLEDGE VAULT)
        doc_ids = state.get("context_document_ids")
        if mode in ["vault", "hybrid"] and doc_ids:
            from app.core.clients import genai_client
            from app.models.rag import AssetEmbedding
            from sqlalchemy import and_

            logger.info(f"LangGraph [Research]: Querying Knowledge Vault for Doc IDs: {doc_ids}")
            query_vec = await genai_client.generate_embeddings(state["resolved_topic"])
            
            # Semantic search across selected organization assets
            chunks = db.query(AssetEmbedding).filter(
                and_( AssetEmbedding.asset_id.in_(doc_ids), AssetEmbedding.asset_id != None )
            ).order_by(AssetEmbedding.embedding.l2_distance(query_vec)).limit(10).all()

            for chunk in chunks:
                internal_findings.append({
                    "title": f"Internal Archive: {chunk.asset.name}",
                    "link": f"asset://{chunk.asset_id}",
                    "snippet": chunk.chunk_content,
                    "source": "INTERNAL_AUTHORITY",
                    "relevance": 100
                })
            logger.info(f"LangGraph [Research]: Retrieved {len(internal_findings)} internal context chunks.")

        # 3. MERGE & FINALIZE
        # If 'vault' only, it's 100% proprietary. If 'hybrid', internal is prepended as authority.
        combined_data = internal_findings + external_research
        
        status_msg = f"Sources: {len(external_research)} Web | {len(internal_findings)} Internal."
        if mode == "vault" and not internal_findings:
            status_msg = "WARNING: Vault Mode active but no relevant internal context found."

        return {
            "serp_data": combined_data,
            "verified_claims": [], # Populated later or from external logic
            "logs": [f"Research Strategy '{mode}' complete. {status_msg}"]
        }
    finally:
        db.close()

async def credibility_node(state: ArticleState) -> Dict[str, Any]:
    """
    Verifies facts and refines the topic.
    """
    logger.info(f"LangGraph [Credibility]: Verifying {len(state.get('serp_data', []))} sources")
    
    if not state.get("serp_data"):
        return {
            "serp_data": [],
            "logs": ["No research data available for verification. Skipping."]
        }
        
    agent = CredibilityAgent()
    db = SessionLocal()
    try:
        input_data = {
            "db": db,
            "research_data": state["serp_data"],
            "category": "Tech News" # Default
        }
        
        result = await agent.run(input_data)
        
        if result.status == "success":
            refined = result.data.get("refined_topic")
            return {
                "resolved_topic": refined if refined else state["resolved_topic"],
                "serp_data": result.data.get("verified_research", state["serp_data"]), # Update with verified only
                "logs": [f"Credibility check complete. Reliability: {result.data.get('confidence_score')}%."]
            }
            
        return {"logs": [f"Credibility node issue: {result.feedback}"]}
    finally:
        db.close()
