import uuid
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.services.blog_generator import BlogGeneratorService
from app.models.task_progress import TaskProgress
from app.models.trending import Trending
from app.schemas.pipeline import PipelineTrigger

router = APIRouter()

@router.post("/trigger", response_model=dict)
async def trigger_pipeline(
    trigger_in: PipelineTrigger,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Trigger the blog generation pipeline with progress tracking.
    """
    topic_id = trigger_in.topic_id
    user_topic = trigger_in.user_topic
    limit = trigger_in.limit
    include_images = trigger_in.include_images
    task_id = str(uuid.uuid4())
    topic_name = user_topic or "Auto-selected Trending"
    
    if topic_id:
        trend = db.query(Trending).filter(Trending.id == topic_id).first()
        if trend:
            topic_name = trend.topic
            
    # Initialize progress record
    steps = [
        {"name": "trend", "status": "pending"},
        {"name": "aggregator", "status": "pending"},
        {"name": "credibility", "status": "pending"},
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
        topic=topic_name,
        status="running",
        steps=steps
    )
    db.add(progress)
    db.commit()
    
    service = BlogGeneratorService(db)
    background_tasks.add_task(
        service.run_full_pipeline, 
        limit=limit, 
        topic_id=topic_id, 
        user_topic=user_topic, 
        task_id=task_id,
        include_images=include_images
    )
    
    return {"message": "Pipeline triggered", "task_id": task_id, "topic": topic_name}

@router.get("/status/{task_id}", response_model=dict)
async def get_task_status(
    task_id: str,
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Get the status of a specific generation task.
    """
    progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return {
        "task_id": progress.task_id,
        "topic": progress.topic,
        "status": progress.status,
        "current_step": progress.current_step,
        "steps": progress.steps,
        "logs": progress.logs,
        "updated_at": progress.updated_at
    }
@router.get("/tasks", response_model=List[dict])
async def get_all_tasks_status(
    db: Session = Depends(deps.get_db),
    limit: int = 100
) -> Any:
    """
    Get the status of all generation tasks.
    """
    tasks = db.query(TaskProgress).order_by(TaskProgress.updated_at.desc()).limit(limit).all()
    return [
        {
            "task_id": t.task_id,
            "topic": t.topic,
            "status": t.status,
            "current_step": t.current_step,
            "steps": t.steps,
            "logs": t.logs,
            "updated_at": t.updated_at
        } for t in tasks
    ]
