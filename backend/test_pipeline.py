import asyncio
from app.modules.orchestrator.service.pipeline_engine import DeterministicPipelineEngine
from app.db.session import SessionLocal
import uuid

async def test_full_pipeline():
    job_id = str(uuid.uuid4())
    topic = "Data Protection Act vs RTI Act India"
    print(f"Testing pipeline for topic: {topic} (Job ID: {job_id})")
    
    engine = DeterministicPipelineEngine(job_id=job_id)
    initial_state = {
        "user_topic": topic,
        "include_images": False
    }
    
    try:
        result = await engine.execute_full_pipeline(initial_state)
        print("Pipeline finished successfully!")
        print(f"Cost: {result.get('cost')}")
    except Exception as e:
        print(f"Pipeline FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
