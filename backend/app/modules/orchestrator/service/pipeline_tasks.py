import asyncio
from app.core.celery_app import celery_app
from app.modules.orchestrator.langgraph.compiler import orchestrator_app
from app.core.redis import publish_update
from langgraph.checkpoint.memory import MemorySaver

# Persistent checkpointer for LangGraph state snapshots
checkpointer = MemorySaver()

from loguru import logger


async def run_langgraph_pipeline(job_id: str, org_id: int, langgraph_state: dict):
    """
    Wrapper to run LangGraph with streaming updates to Redis.
    """
    final_state = {}
    
    # Notify start
    await publish_update(f"org_updates:{org_id}", {
        "task_id": job_id,
        "status": "running",
        "current_step": "discovery",
        "message": "Orchestrator started."
    })

    # Pass the job_id as the thread_id for state persistence
    config = {"configurable": {"thread_id": job_id}}

    async for event in orchestrator_app.astream(langgraph_state, config=config):

        # LangGraph emits events as a dict where keys are node names
        for node_name, state_update in event.items():
            if not isinstance(state_update, dict):
                if node_name != "__interrupt__":
                    logger.debug(f"System node '{node_name}' yielding metadata.")
                continue
                
            logger.info(f"Node '{node_name}' finished for Job ID {job_id}")
            
            # Extract logs or status from state if available
            logs = state_update.get("logs", [])
            last_message = logs[-1] if logs else f"Step {node_name} completed."
            
            # Publish update to Redis
            await publish_update(f"org_updates:{org_id}", {
                "task_id": job_id,
                "status": "running",
                "current_step": node_name,
                "message": last_message,
                "logs": logs
            })
            
            final_state.update(state_update)

    # CRITICAL: Since we use a checkpointer, we should get the full consolidated state
    # rather than relying on the accumulation of delta updates in final_state.
    try:
        full_state_snapshot = await orchestrator_app.aget_state(config)
        return full_state_snapshot.values
    except Exception as e:
        logger.error(f"Failed to get final state from checkpointer: {e}")
        return final_state


@celery_app.task(bind=True, name="blot.orchestrator.execute_seo_pipeline", max_retries=3, queue="heavy")
def execute_seo_pipeline_task(self, job_id: str, initial_state: dict):
    """
    Celery background worker task for running the autonomous SEO pipeline.
    Uses async streaming to push real-time updates to Redis Pub/Sub.
    """
    logger.info(f"Celery Worker picked up Job ID: {job_id}")
    org_id = initial_state.get('org_id', 1)

    # Fetch latest Org settings for personalization
    from app.db.session import get_db_session
    from app.models.user import Organization
    
    personalization = {
        "enabled": False,
        "company_profile": {},
        "user_profile": initial_state.get("personalization", {}).get("user_profile", {})
    }
    
    with get_db_session() as db:
        org = db.query(Organization).get(org_id)
        if org:
            personalization["enabled"] = org.personalization_enabled
            personalization["company_profile"] = {
                "company_name": org.name,
                "industry": org.industry,
                "description": org.description,
                "brand_voice": org.brand_voice,
                "brand_tone": org.brand_tone,
                "target_audience": org.target_audience,
                "products_services": org.products_services,
                "usp": org.usp,
                "geography": org.geography,
                "key_messages": org.key_messages,
                "keywords": org.preferred_keywords
            }
            logger.info(f"Personalization Loaded for {org.name}: {personalization['enabled']}")

    langgraph_state = {
        "job_id": job_id,
        "org_id": org_id,
        "user_topic": initial_state.get("user_topic"),
        "topic_id": initial_state.get("topic_id"),
        "resolved_topic": initial_state.get("user_topic"),
        "reuse_scrape": initial_state.get("reuse_scrape", False),
        "include_images": initial_state.get("include_images", True),
        "serp_data": [],
        "verified_claims": [],
        "keyword_clusters": [],
        "primary_keyword": None,
        "search_intent": None,
        "serp_blueprint": {},
        "draft_iterations": [],
        "evaluation_feedback": [],
        "all_images": [],
        "loop_count": 0,
        "is_approved": False,
        "context_document_ids": initial_state.get("context_document_ids", []),
        "research_mode": initial_state.get("research_mode", "hybrid"),
        "personalization": personalization,
        "logs": ["LangGraph Orchestrator initialized successfully."]
    }

    try:
        from asgiref.sync import async_to_sync
        
        # Run the async wrapper
        final_state = async_to_sync(run_langgraph_pipeline)(job_id, org_id, langgraph_state)
        logger.info(f"Final State Keys: {list(final_state.keys())}")
        draft = final_state.get('current_draft')
        if draft:
            logger.info(f"Draft found! Length: {len(draft)}")
        else:
            logger.warning("Draft MISSING or None in Final State!")

        # --- SAVE TO DATABASE ---
        from app.db.session import get_db_session
        from app.models.post import Post
        from app.models.task_progress import TaskProgress

        with get_db_session() as db:
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == job_id).first()
            if progress:
                progress.status = "completed"
                progress.current_step = "evaluation"

            # 6. ENCAPSULATE IN PERSISTENT ORM MODEL
            try:
                # Safely extract title and content from the state
                raw_title = final_state.get("resolved_topic") or final_state.get("user_topic") or "Untitled Post"
                raw_content = final_state.get("current_draft") or "No content generated."
                
                # Ensure they are strings (some nodes might return list of lines)
                title_str = " ".join(raw_title) if isinstance(raw_title, list) else str(raw_title)
                content_str = "\n\n".join(raw_content) if isinstance(raw_content, list) else str(raw_content)
                
                # Extract word count
                word_count = len(content_str.split())
                
                seo_pack = final_state.get("seo_pack", {})
                
                new_post = Post(
                    org_id=org_id,
                    title=[title_str],
                    content=[content_str],
                    meta=seo_pack.get("meta_description", "Expertly synthesized content."),
                    word_count=word_count,
                    status="Draft",
                    tags=seo_pack.get("hashtags", []),
                    seo_data=seo_pack,
                    research_sources=final_state.get("serp_data", []),
                    image_crm=[final_state.get("cover_image", {}).get("crm_path")] if final_state.get("cover_image") else [],
                    agent_telemetry=final_state.get("logs", [])
                )
                db.add(new_post)
                db.commit()
                logger.success(f"Successfully saved generated post for Job ID {job_id}")
            except Exception as db_e:
                logger.error(f"Failed to save post to DB: {db_e}")
                
            # Notify completion
            async_to_sync(publish_update)(f"org_updates:{org_id}", {
                "task_id": job_id,
                "status": "completed",
                "current_step": "completed",
                "message": "Pipeline finished successfully."
            })
            return final_state

    except Exception as exc:
        logger.error(f"Task Failed for Job ID {job_id}: {exc}")
        
        try:
            from asgiref.sync import async_to_sync
            # Notify error
            async_to_sync(publish_update)(f"org_updates:{org_id}", {
                "task_id": job_id,
                "status": "error",
                "current_step": "error",
                "message": f"Task failed: {str(exc)}"
            })
        except:
            pass

        try:
            from app.db.session import get_db_session
            from app.models.task_progress import TaskProgress
            with get_db_session() as db:
                progress = db.query(TaskProgress).filter(TaskProgress.task_id == job_id).first()
                if progress:
                    progress.status = "error"
                    progress.current_step = "error"
        except Exception as err_save:
            logger.error(f"Failed to mark task as error in DB: {err_save}")

        raise self.retry(exc=exc, countdown=60)
