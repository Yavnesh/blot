import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.task_progress import TaskProgress
from app.modules.orchestrator.service.pipeline_tasks import execute_seo_pipeline_task
from loguru import logger

def rerun_last_failed():
    db = SessionLocal()
    try:
        # Find the most recent task that failed
        failed_task = db.query(TaskProgress).filter(
            TaskProgress.status == "error"
        ).order_by(TaskProgress.updated_at.desc()).first()
        
        if not failed_task:
            print("No failed tasks found in the last 100 records.")
            return

        print(f"Found failed task: {failed_task.task_id} (Topic: {failed_task.topic})")
        
        # Reconstruct initial state
        # Since we don't store initial_state in TaskProgress, we have to infer it or look for it.
        # However, we can use the topic as a 'user_topic' and trigger it as a new task.
        
        initial_state = {
            "user_topic": failed_task.topic,
            "include_images": True, # Default to True
            "image_provider": "google", # Default provider
            "reuse_scrape": False,
            "task_id": None # Will be generated in trigger_pipeline if we went through API
        }
        
        # If we want to strictly rerun the SAME job ID (might be better for tracking)
        # But usually a new task_id is better for fresh start.
        
        # Let's see if we can trigger it through the same mechanism as the API
        from app.api.api_v1.endpoints.generation import trigger_pipeline
        # We can't easily call the API function directly because of dependencies.
        
        # Let's just trigger the celery task directly with a NEW task_id
        import uuid
        new_task_id = str(uuid.uuid4())
        initial_state["task_id"] = new_task_id
        
        # Initialize new progress record
        steps = [
            {"name": "trend", "status": "completed"},
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
        
        new_progress = TaskProgress(
            task_id=new_task_id,
            topic=failed_task.topic,
            status="running",
            steps=steps
        )
        db.add(new_progress)
        db.commit()
        
        print(f"Triggering NEW task {new_task_id} for topic: {failed_task.topic}")
        execute_seo_pipeline_task.delay(job_id=new_task_id, initial_state=initial_state)
        print("Success!")
        
    finally:
        db.close()

if __name__ == "__main__":
    rerun_last_failed()
