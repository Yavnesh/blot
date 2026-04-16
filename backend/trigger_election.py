import asyncio
import uuid
import sys
import os

# Add the current directory to sys.path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

try:
    from app.modules.orchestrator.service.pipeline_tasks import execute_seo_pipeline_task
    from app.db.session import SessionLocal
    from app.models.task_progress import TaskProgress
except ImportError as e:
    print(f"Error importing app modules: {e}")
    sys.exit(1)

def trigger_pipeline(topic: str):
    task_id = str(uuid.uuid4())
    org_id = 1
    
    # Initialize basic progress record for status tracking
    db = SessionLocal()
    try:
        progress = TaskProgress(
            task_id=task_id,
            org_id=org_id,
            topic=topic,
            status="running",
            steps=[{"name": "research", "status": "pending"}] # Simplified
        )
        db.add(progress)
        db.commit()
    finally:
        db.close()

    # Initialize state
    initial_state = {
        "topic_id": None,
        "user_topic": topic,
        "post_id": None,
        "include_images": False,
        "image_provider": "stable_horde",
        "reuse_scrape": False,
        "task_id": task_id,
        "org_id": org_id,
        "context_document_ids": [],
        "research_mode": "hybrid"
    }
    
    print(f"\n🚀 Triggering E2E Pipeline for: {topic}")
    print(f"🆔 Job ID: {task_id}")
    print("-" * 40)
    
    # Trigger the task via Celery
    try:
        result = execute_seo_pipeline_task.delay(job_id=task_id, initial_state=initial_state)
        print(f"✅ Celery Task Queued! Result ID: {result.id}")
        print("\n[MONITORING]")
        print("1. Check Celery worker logs.")
        print(f"2. Status URL: http://localhost:8080/api/v1/generation/status/{task_id}")
        print(f"3. Dashboard: http://localhost:5173/posts")
    except Exception as e:
        print(f"❌ Failed to queue task: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic", default="Indian Elections 2026")
    args = parser.parse_args()
    
    trigger_pipeline(args.topic)
