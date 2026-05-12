from typing import Dict, Any, List
from loguru import logger
from app.modules.orchestrator.langgraph.state import ArticleState
from app.agents.improvement.seo_agent import SEOAgent
from app.agents.improvement.readability_agent import ReadabilityAgent
from app.agents.improvement.originality_agent import OriginalityAgent
from app.agents.governance.legal_agent import LegalAgent

async def optimization_node(state: ArticleState) -> Dict[str, Any]:
    """
    Parallel-ish execution of SEO, Readability, and Compliance agents.
    In the final graph, these could be separate nodes, but for now we'll 
    aggregate them to produce a combined 'Optimization Report'.
    """
    logger.info(f"LangGraph [Optimization]: Polishing final metrics for Job {state['job_id']}")
    
    content = state.get("current_draft")
    if not content:
        return {"logs": ["Optimization aborted: No content draft found."]}
        
    # 1. SEO Pack Generation
    seo_agent = SEOAgent()
    seo_result = await seo_agent.run({
        "final_draft": content,
        "topic": state.get("resolved_topic", ""),
        "primary_keyword": state.get("primary_keyword"),
        "long_tail_keywords": state.get("keyword_clusters", []),
        "word_count_target": 1500
    })
    
    # 2. Readability Analysis
    readability_agent = ReadabilityAgent()
    readability_result = await readability_agent.run({"content": content})
    
    # 3. Originality/Plagiarism Check
    originality_agent = OriginalityAgent()
    originality_result = await originality_agent.run({
        "content": content,
        "topic": state.get("resolved_topic")
    })
    
    # 4. Legal / Compliance Sweep
    legal_agent = LegalAgent()
    legal_result = await legal_agent.run({"content": content})
    
    # Extract results with fallbacks
    seo_data = seo_result.data.get("seo_data", {})
    readability_data = readability_result.data
    originality_data = originality_result.data
    legal_data = legal_result.data
    
    # 5. Aggregate SEO Pack (Merges full agent results for storage)
    seo_pack = {
        **seo_data,
        "score": float(seo_data.get("score", 0)),
        "coverage": float(seo_data.get("coverage_score", 0)),
        "readability": float(readability_data.get("readability_score", 0)),
        "originality": float(originality_data.get("originality_score", 0)),
        "legal_clearance": bool(legal_data.get("legal_clearance", True)),
        "readability_grade": readability_data.get("grade_level", "Standard")
    }
    
    return {
        "seo_score": float(seo_data.get("score", 0)),
        "readability_score": float(readability_data.get("readability_score", 0)),
        "originality_score": float(originality_data.get("originality_score", 0)),
        "legal_clearance": bool(legal_data.get("legal_clearance", True)),
        "seo_pack": seo_pack,
        "logs": [
            f"SEO Score: {seo_data.get('score', 0)}% | Coverage: {seo_data.get('coverage_score', 0)}%",
            f"Readability Grade: {readability_data.get('grade_level', 'Standard')}",
            f"Originality Confirmed: {originality_data.get('originality_score', 0)}%",
            f"Legal Compliance: {'PASSED' if legal_data.get('legal_clearance', True) else 'FLAGGED'}"
        ]
    }
