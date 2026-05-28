import asyncio
from app.core.celery_app import celery_app
from app.modules.orchestrator.langgraph.compiler import orchestrator_app
from app.core.redis import publish_update
from langgraph.checkpoint.memory import MemorySaver

# Persistent checkpointer for LangGraph state snapshots
checkpointer = MemorySaver()

from loguru import logger

def save_post_taxonomy_data(db, post_id: int, final_state: dict):
    from app.models.taxonomy import PostTaxonomy
    try:
        # Clean any existing taxonomy selections for this post
        db.query(PostTaxonomy).filter(PostTaxonomy.post_id == post_id).delete()
        
        # Save target audience taxonomy if present
        ta = final_state.get("target_audience_taxonomy")
        if ta:
            ta_record = PostTaxonomy(
                post_id=post_id,
                category_id=ta.get("category_id"),
                primary_subcategory_id=ta.get("primary_subcategory_id"),
                secondary_subcategory_ids=ta.get("secondary_subcategory_ids", [])
            )
            db.add(ta_record)
            
        # Save editorial tone taxonomy if present
        et = final_state.get("editorial_tone_taxonomy")
        if et:
            et_record = PostTaxonomy(
                post_id=post_id,
                category_id=et.get("category_id"),
                primary_subcategory_id=et.get("primary_subcategory_id"),
                secondary_subcategory_ids=et.get("secondary_subcategory_ids", [])
            )
            db.add(et_record)
            
        db.commit()
        logger.info(f"Saved taxonomy classification for Post ID {post_id}")
    except Exception as e:
        logger.error(f"Failed to save post taxonomy: {e}")


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
        "pipeline_type": initial_state.get("pipeline_type", "blog"),
        "instagram_format": initial_state.get("instagram_format"),
        "tone": initial_state.get("tone"),
        "audience": initial_state.get("audience"),
        "word_count_target": initial_state.get("word_count_target", 1500),
        "target_audience_taxonomy": initial_state.get("target_audience_taxonomy"),
        "editorial_tone_taxonomy": initial_state.get("editorial_tone_taxonomy"),
        "personalization": personalization,
        "logs": ["LangGraph Orchestrator initialized successfully."]
    }

    try:
        from asgiref.sync import async_to_sync
        
        # Run the async wrapper
        final_state = async_to_sync(run_langgraph_pipeline)(job_id, org_id, langgraph_state)
        logger.info(f"Final State Keys: {list(final_state.keys())}")
        
        config = {"configurable": {"thread_id": job_id}}
        snapshot = async_to_sync(orchestrator_app.aget_state)(config)
        is_interrupted = len(snapshot.next) > 0
        
        if is_interrupted:
            logger.info(f"LangGraph execution interrupted. Next nodes: {snapshot.next}")
            
            from app.db.session import get_db_session
            from app.models.task_progress import TaskProgress

            # Extract title and drafts for preview
            raw_title = final_state.get("resolved_topic") or final_state.get("user_topic") or "Untitled Post"
            title_str = " ".join(raw_title) if isinstance(raw_title, list) else str(raw_title)
            
            raw_content = final_state.get("current_draft") or "No content generated."
            content_str = "\n\n".join(raw_content) if isinstance(raw_content, list) else str(raw_content)
            
            pipeline_type = final_state.get("pipeline_type", "blog")
            
            preview_data = {
                "title": title_str,
                "content": content_str,
                "pipeline_type": pipeline_type,
                "instagram_format": final_state.get("instagram_format"),
                "tone": final_state.get("tone"),
                "audience": final_state.get("audience"),
                "target_audience_taxonomy": final_state.get("target_audience_taxonomy"),
                "editorial_tone_taxonomy": final_state.get("editorial_tone_taxonomy")
            }
            if pipeline_type == "instagram":
                try:
                    import json
                    draft_data = json.loads(content_str)
                    preview_data["instagram_data"] = draft_data
                except Exception as json_err:
                    logger.error(f"Failed to parse Instagram content JSON for preview: {json_err}")

            with get_db_session() as db:
                progress = db.query(TaskProgress).filter(TaskProgress.task_id == job_id).first()
                if progress:
                    progress.status = "awaiting_approval"
                    progress.current_step = "approval"
                    progress.preview_data = preview_data
                    progress.logs = final_state.get("logs", [])
                    db.commit()
            
            # Notify awaiting approval
            async_to_sync(publish_update)(f"org_updates:{org_id}", {
                "task_id": job_id,
                "status": "awaiting_approval",
                "current_step": "approval",
                "message": "Pipeline paused. Awaiting human approval.",
                "current_draft": content_str,
                "preview_data": preview_data,
                "logs": final_state.get("logs", [])
            })
            return final_state
        
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
                
                pipeline_type = final_state.get("pipeline_type", "blog")
                tags = []
                pub_platform = "none"
                if pipeline_type == "instagram":
                    pub_platform = "instagram"
                    try:
                        import json
                        draft_data = json.loads(content_str)
                        tags = draft_data.get("hashtags", [])
                    except Exception as json_err:
                        logger.error(f"Failed to parse Instagram content JSON for tags: {json_err}")
                else:
                    tags = seo_pack.get("hashtags", []) if seo_pack else []

                new_post = Post(
                    org_id=org_id,
                    title=[title_str],
                    content=[content_str],
                    meta=seo_pack.get("meta_description", "Expertly synthesized content.") if seo_pack else "Expertly synthesized content.",
                    word_count=word_count,
                    status="Draft",
                    tags=tags,
                    seo_data=seo_pack or {},
                    research_sources=final_state.get("serp_data", []),
                    image_crm=[final_state.get("cover_image", {}).get("crm_path")] if final_state.get("cover_image") else [],
                    agent_telemetry=final_state.get("logs", []),
                    pub_platform=pub_platform
                )
                db.add(new_post)
                db.commit()
                db.refresh(new_post)
                save_post_taxonomy_data(db, new_post.id, final_state)
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
                    db.commit()
        except Exception as err_save:
            logger.error(f"Failed to mark task as error in DB: {err_save}")

        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, name="blot.orchestrator.resume_seo_pipeline", max_retries=3, queue="heavy")
def resume_seo_pipeline_task(self, job_id: str, org_id: int, approved: bool, feedback: str):
    """
    Celery background worker task for resuming the autonomous pipeline after user input (HITL).
    Updates the state with human decision and resumes LangGraph execution.
    """
    logger.info(f"Celery Worker resuming Job ID: {job_id} (Approved: {approved})")
    
    try:
        from asgiref.sync import async_to_sync
        
        async def resume_langgraph_pipeline():
            config = {"configurable": {"thread_id": job_id}}
            
            # Update state with human input
            await orchestrator_app.aupdate_state(
                config,
                {
                    "human_approved": approved,
                    "human_feedback": feedback
                },
                as_node="approval"
            )
            
            # Notify resume starting
            await publish_update(f"org_updates:{org_id}", {
                "task_id": job_id,
                "status": "running",
                "current_step": "approval",
                "message": "Orchestrator resuming execution."
            })
            
            final_state = {}
            # Resume graph execution (input is None since we resume)
            async for event in orchestrator_app.astream(None, config=config):
                for node_name, state_update in event.items():
                    if not isinstance(state_update, dict):
                        if node_name != "__interrupt__":
                            logger.debug(f"System node '{node_name}' yielding metadata.")
                        continue
                        
                    logger.info(f"Node '{node_name}' finished for Job ID {job_id}")
                    
                    logs = state_update.get("logs", [])
                    last_message = logs[-1] if logs else f"Step {node_name} completed."
                    
                    await publish_update(f"org_updates:{org_id}", {
                        "task_id": job_id,
                        "status": "running",
                        "current_step": node_name,
                        "message": last_message,
                        "logs": logs
                    })
                    final_state.update(state_update)

            try:
                full_state_snapshot = await orchestrator_app.aget_state(config)
                return full_state_snapshot.values
            except Exception as e:
                logger.error(f"Failed to get final state from checkpointer: {e}")
                return final_state

        final_state = async_to_sync(resume_langgraph_pipeline)()
        
        # Check if it was interrupted again
        config = {"configurable": {"thread_id": job_id}}
        snapshot = async_to_sync(orchestrator_app.aget_state)(config)
        is_interrupted = len(snapshot.next) > 0
        
        if is_interrupted:
            logger.info(f"Resumed LangGraph execution paused again. Next nodes: {snapshot.next}")
            
            from app.db.session import get_db_session
            from app.models.task_progress import TaskProgress

            raw_title = final_state.get("resolved_topic") or final_state.get("user_topic") or "Untitled Post"
            title_str = " ".join(raw_title) if isinstance(raw_title, list) else str(raw_title)
            
            raw_content = final_state.get("current_draft") or "No content generated."
            content_str = "\n\n".join(raw_content) if isinstance(raw_content, list) else str(raw_content)
            
            pipeline_type = final_state.get("pipeline_type", "blog")
            
            preview_data = {
                "title": title_str,
                "content": content_str,
                "pipeline_type": pipeline_type,
                "instagram_format": final_state.get("instagram_format"),
                "tone": final_state.get("tone"),
                "audience": final_state.get("audience"),
                "target_audience_taxonomy": final_state.get("target_audience_taxonomy"),
                "editorial_tone_taxonomy": final_state.get("editorial_tone_taxonomy")
            }
            if pipeline_type == "instagram":
                try:
                    import json
                    draft_data = json.loads(content_str)
                    preview_data["instagram_data"] = draft_data
                except Exception as json_err:
                    logger.error(f"Failed to parse Instagram content JSON for preview: {json_err}")

            with get_db_session() as db:
                progress = db.query(TaskProgress).filter(TaskProgress.task_id == job_id).first()
                if progress:
                    progress.status = "awaiting_approval"
                    progress.current_step = "approval"
                    progress.preview_data = preview_data
                    progress.logs = final_state.get("logs", [])
                    db.commit()
            
            async_to_sync(publish_update)(f"org_updates:{org_id}", {
                "task_id": job_id,
                "status": "awaiting_approval",
                "current_step": "approval",
                "message": "Pipeline paused again. Awaiting human approval.",
                "current_draft": content_str,
                "preview_data": preview_data,
                "logs": final_state.get("logs", [])
            })
            return final_state

        draft = final_state.get('current_draft')
        if draft:
            logger.info(f"Draft found after resume! Length: {len(draft)}")
        else:
            logger.warning("Draft MISSING or None in Final State after resume!")

        # --- SAVE TO DATABASE ---
        from app.db.session import get_db_session
        from app.models.post import Post
        from app.models.task_progress import TaskProgress

        with get_db_session() as db:
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == job_id).first()
            if progress:
                progress.status = "completed"
                progress.current_step = "evaluation"

            try:
                raw_title = final_state.get("resolved_topic") or final_state.get("user_topic") or "Untitled Post"
                raw_content = final_state.get("current_draft") or "No content generated."
                
                title_str = " ".join(raw_title) if isinstance(raw_title, list) else str(raw_title)
                content_str = "\n\n".join(raw_content) if isinstance(raw_content, list) else str(raw_content)
                word_count = len(content_str.split())
                
                seo_pack = final_state.get("seo_pack", {})
                pipeline_type = final_state.get("pipeline_type", "blog")
                tags = []
                pub_platform = "none"
                if pipeline_type == "instagram":
                    pub_platform = "instagram"
                    try:
                        import json
                        draft_data = json.loads(content_str)
                        tags = draft_data.get("hashtags", [])
                    except Exception as json_err:
                        logger.error(f"Failed to parse Instagram content JSON for tags: {json_err}")
                else:
                    tags = seo_pack.get("hashtags", []) if seo_pack else []

                new_post = Post(
                    org_id=org_id,
                    title=[title_str],
                    content=[content_str],
                    meta=seo_pack.get("meta_description", "Expertly synthesized content.") if seo_pack else "Expertly synthesized content.",
                    word_count=word_count,
                    status="Draft",
                    tags=tags,
                    seo_data=seo_pack or {},
                    research_sources=final_state.get("serp_data", []),
                    image_crm=[final_state.get("cover_image", {}).get("crm_path")] if final_state.get("cover_image") else [],
                    agent_telemetry=final_state.get("logs", []),
                    pub_platform=pub_platform
                )
                db.add(new_post)
                db.commit()
                db.refresh(new_post)
                save_post_taxonomy_data(db, new_post.id, final_state)
                logger.success(f"Successfully saved post on resumption for Job ID {job_id}")
            except Exception as db_e:
                logger.error(f"Failed to save post to DB on resumption: {db_e}")

            # Notify completion
            async_to_sync(publish_update)(f"org_updates:{org_id}", {
                "task_id": job_id,
                "status": "completed",
                "current_step": "completed",
                "message": "Pipeline finished successfully."
            })
            return final_state

    except Exception as exc:
        logger.error(f"Task resumption failed for Job ID {job_id}: {exc}")
        try:
            from asgiref.sync import async_to_sync
            async_to_sync(publish_update)(f"org_updates:{org_id}", {
                "task_id": job_id,
                "status": "error",
                "current_step": "error",
                "message": f"Task resumption failed: {str(exc)}"
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
                    db.commit()
        except Exception as err_save:
            logger.error(f"Failed to mark task as error on resumption: {err_save}")

        raise self.retry(exc=exc, countdown=60)
