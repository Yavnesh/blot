from typing import Dict, Any, List
from loguru import logger
from app.modules.orchestrator.langgraph.state import ArticleState
from app.agents.writing.draft_agent import DraftAgent
from app.agents.writing.voice_agent import VoiceAgent
from app.services.rag_service import retrieve_context
from app.db.session import SessionLocal

async def writing_node(state: ArticleState) -> Dict[str, Any]:
    """
    Orchestrates the drafting and voice personalization phase.
    """
    logger.info(f"LangGraph [Writing]: Drafting the article for '{state['resolved_topic']}'")
    
    # NEW: Enterprise RAG Retrieval Step
    db = SessionLocal()
    rag_context = ""
    try:
        context_chunks = await retrieve_context(
            db=db, 
            org_id=state['org_id'], 
            query=state['resolved_topic'], 
            limit=3
        )
        if context_chunks:
            rag_context = "\n\n--- Enterprise Brand Context ---\n" + "\n\n".join(context_chunks)
            logger.info(f"RAG: Injected {len(context_chunks)} semantic chunks into draft context.")
    except Exception as rag_e:
        logger.warning(f"RAG Retrieval failed: {rag_e}")
    finally:
        db.close()

    # 1. Drafting Phase
    draft_agent = DraftAgent()
    draft_input = {
        "verified_research": state.get("serp_data", []),
        "serp_blueprint": state.get("serp_blueprint"), 
        "topic": state["resolved_topic"],
        "primary_keyword": state.get("primary_keyword"),
        "word_count_target": 1500,
        "target_audience": state.get("personalization", {}).get("company_profile", {}).get("target_audience", "Digital Marketing Professionals"),
        "tone_guide": f"{state.get('brand_voice_prompt', '')}\n{rag_context}", # Inject RAG Context here
        "personalization": state.get("personalization", {})
    }
    
    draft_result = await draft_agent.run(draft_input)
    logger.info(f"DraftAgent Status: {draft_result.status}")
    
    if draft_result.status != "success":
        return {
            "current_draft": None,
            "logs": [f"Drafting failed: {draft_result.feedback}"]
        }
    
    initial_draft = draft_result.data.get("draft_content", "")
    
    # 2. Voice Personalization Phase
    voice_agent = VoiceAgent()
    voice_input = {
        "draft_content": initial_draft,
        "brand_rules": state.get("brand_voice_prompt", "Authoritative, Insightful, and Human-centric."),
        "personalization": state.get("personalization", {})
    }
    
    voice_result = await voice_agent.run(voice_input)
    logger.info(f"VoiceAgent Status: {voice_result.status}")
    
    if voice_result.status != "success":
        # Don't fail the whole process for voice issues, just fallback to initial draft
        logger.warning(f"Voice Personalization failed: {voice_result.feedback}")
        return {
            "draft_iterations": [initial_draft],
            "current_draft": initial_draft,
            "logs": ["Initial draft complete. Voice personalization failed — using raw draft."]
        }
    
    final_prose = voice_result.data.get("final_draft", initial_draft)
    logger.info(f"Final Prose Length: {len(final_prose)} characters")
    if not final_prose:
        logger.error("Final Prose is EMPTY!")
    
    return {
        "draft_iterations": [final_prose],
        "current_draft": final_prose,
        "logs": [f"Article drafted successfully. Word Count: {len(final_prose.split())}"]
    }
