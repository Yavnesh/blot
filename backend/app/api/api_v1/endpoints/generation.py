import uuid
import asyncio
import json
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from jose import jwt
from app.core.config import settings
from app.schemas.user import TokenPayload
from app.models.user import User

from app.api import deps
from app.models.task_progress import TaskProgress
from app.models.trending import Trending
from app.models.user import Organization
from app.schemas.pipeline import PipelineTrigger
from app.core.redis import redis_client

router = APIRouter()

@router.post("/trigger", response_model=dict)
async def trigger_pipeline(
    trigger_in: PipelineTrigger,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_org: Organization = Depends(deps.get_current_active_org),
    current_user: User = Depends(deps.get_current_active_user),
    _role_check = Depends(deps.require_role("owner", "editor")),
    _quota_check = Depends(deps.verify_quota("generation"))
) -> Any:
    """
    Trigger the blog generation pipeline with progress tracking.
    """
    topic_id = trigger_in.topic_id
    user_topic = trigger_in.user_topic
    post_id = trigger_in.post_id
    limit = trigger_in.limit
    include_images = trigger_in.include_images
    image_provider = trigger_in.image_provider
    reuse_scrape = trigger_in.reuse_scrape
    task_id = str(uuid.uuid4())
    topic_name = user_topic or "Auto-selected Trending"
    
    if topic_id:
        trend = db.query(Trending).filter(Trending.id == topic_id).first()
        if trend:
            topic_name = trend.topic
    elif post_id:
        from app.models.post import Post
        post = db.query(Post).filter(Post.id == post_id).first()
        if post:
            topic_name = (post.title[0] if isinstance(post.title, list) else post.title) or f"Post #{post_id}"
            
    # Initialize progress record
    steps = [
        {"name": "trend", "status": "completed" if user_topic or topic_id else "pending"},
        {"name": "aggregator", "status": "pending"},
        {"name": "credibility", "status": "pending"},
        {"name": "keyword_cluster", "status": "pending"},
        {"name": "intent", "status": "pending"},
        {"name": "draft", "status": "pending"},
        {"name": "voice", "status": "pending"},
        {"name": "image", "status": "pending"},
        {"name": "seo", "status": "pending"},
        {"name": "readability", "status": "pending"},
        {"name": "originality", "status": "pending"},
        {"name": "legal", "status": "pending"},
        {"name": "evaluator", "status": "pending"}
    ]
    
    if not include_images:
        steps = [s for s in steps if s["name"] != "image"]

    progress = TaskProgress(
        task_id=task_id,
        org_id=current_org.id,
        topic=topic_name,
        status="running",
        steps=steps
    )
    db.add(progress)
    db.commit()
    
    # Trigger Celery Task
    from app.modules.orchestrator.service.pipeline_tasks import execute_seo_pipeline_task
    
    initial_state = {
        "topic_id": topic_id,
        "user_topic": user_topic,
        "post_id": post_id,
        "include_images": include_images,
        "image_provider": image_provider,
        "reuse_scrape": reuse_scrape,
        "task_id": task_id,
        "org_id": current_org.id,
        "context_document_ids": trigger_in.context_document_ids or [],
        "research_mode": trigger_in.research_mode or 'hybrid',
        "personalization": {
            "enabled": current_org.personalization_enabled,
            "user_profile": {
                "name": current_user.full_name,
                "role": current_user.role_position,
                "writing_preference": current_user.writing_preference,
                "audience_level": current_user.audience_familiarity
            },
            "company_profile": {
                "company_name": current_org.name,
                "industry": current_org.industry,
                "description": current_org.description,
                "brand_voice": current_org.brand_voice,
                "brand_tone": current_org.brand_tone,
                "target_audience": current_org.target_audience,
                "products_services": current_org.products_services,
                "usp": current_org.usp,
                "content_goals": current_org.content_goals,
                "keywords": current_org.preferred_keywords.split(',') if current_org.preferred_keywords else [],
                "competitors": current_org.competitors.split(',') if current_org.competitors else []
            }
        }
    }
    
    execute_seo_pipeline_task.delay(job_id=task_id, initial_state=initial_state)
    
    return {"message": "Pipeline triggered via Celery", "task_id": task_id, "topic": topic_name}

@router.get("/status/{task_id}", response_model=dict)
async def get_task_status(
    task_id: str,
    db: Session = Depends(deps.get_db),
    current_org: Organization = Depends(deps.get_current_active_org)
) -> Any:
    """
    Get the status of a specific generation task.
    """
    progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id, TaskProgress.org_id == current_org.id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return {
        "task_id": progress.task_id,
        "topic": progress.topic,
        "status": progress.status,
        "current_step": progress.current_step,
        "steps": progress.steps,
        "logs": progress.logs,
        "preview_data": progress.preview_data,
        "updated_at": progress.updated_at
    }

@router.get("/tasks", response_model=List[dict])
async def get_all_tasks_status(
    db: Session = Depends(deps.get_db),
    limit: int = 100,
    current_org: Organization = Depends(deps.get_current_active_org)
) -> Any:
    """
    Get the status of all generation tasks.
    """
    tasks = db.query(TaskProgress).filter(TaskProgress.org_id == current_org.id).order_by(TaskProgress.updated_at.desc()).limit(limit).all()
    return [
        {
            "task_id": t.task_id,
            "topic": t.topic,
            "status": t.status,
            "current_step": t.current_step,
            "steps": t.steps,
            "logs": t.logs,
            "preview_data": t.preview_data,
            "updated_at": t.updated_at
        } for t in tasks
    ]

@router.websocket("/ws/tasks/{org_id}")
async def websocket_tasks(
    websocket: WebSocket, 
    org_id: int,
    token: str = Query(..., description="JWT token for auth"),
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Real-time task streaming via Redis Pub/Sub.
    Listens for updates scoped to the organization.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
        user = db.query(User).filter(User.id == token_data.sub).first()
        if not user or not user.is_active:
            raise Exception("Invalid user")
        # Check org access
        if not any(o.id == org_id for o in user.organizations) and not user.is_superuser:
            raise Exception("Access denied to organization")
    except Exception as e:
        logger.error(f"WebSocket auth failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    
    pubsub = redis_client.pubsub()
    channel_name = f"org_updates:{org_id}"
    await pubsub.subscribe(channel_name)
    
    try:
        # Send initial state: all currently running tasks for this org
        # (Simplified: just send a message that we are listening)
        await websocket.send_json({"message": f"Subscribed to {channel_name}"})
        
        while True:
            # Check for new messages from Redis
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                data = json.loads(message["data"])
                await websocket.send_json(data)
            
            # Keepalive / check if client is still there
            await asyncio.sleep(0.1)
            
    except WebSocketDisconnect:
        await pubsub.unsubscribe(channel_name)
    except Exception as e:
        print(f"WebSocket Error: {str(e)}")
        if websocket.application_state.name != "DISCONNECTED":
            await websocket.close()
    finally:
        await pubsub.close()
