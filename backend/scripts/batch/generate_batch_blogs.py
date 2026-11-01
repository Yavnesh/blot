import asyncio
from app.agents.core.editorial_orchestrator import EditorialOrchestrator
from app.db.session import SessionLocal

async def generate_batch(count=5):
    db = SessionLocal()
    orchestrator = EditorialOrchestrator()
    print(f"Starting batch generation of {count} blogs...")
    
    for i in range(count):
        print(f"\n--- Generating Blog {i+1} of {count} ---")
        try:
            content = await orchestrator.run_editorial_workflow(
                db, 
                topic_id=None, 
                target_audience="Technology Enthusiasts"
            )
            if content:
                print(f"SUCCESS: {content.get('title')}")
            else:
                print("FAILED: No content generated.")
            
            if i < count - 1:
                print("Waiting 60s to respect Gemini API free tier rate limits (RPM)...")
                await asyncio.sleep(60)
        except Exception as e:
            print(f"ERROR: {e}")
            
    db.close()
    print("\nBatch generation task complete.")

if __name__ == "__main__":
    asyncio.run(generate_batch(5))
