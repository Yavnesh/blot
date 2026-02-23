import asyncio
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.agents.core.editorial_orchestrator import EditorialOrchestrator
from loguru import logger

async def verify_pipeline():
    db = SessionLocal()
    orchestrator = EditorialOrchestrator()
    
    logger.info("Starting Agentic Editorial Pipeline Verification")
    
    # We'll use a known trending topic if possible, or let the trend agent find one.
    # Topic ID 1 is likely present if the user has been running the app.
    # For a clean test, we might want to pass a specific topic to the orchestrator.
    
    try:
        # Step 1: Run the full workflow (will auto-detect trends)
        content = await orchestrator.run_editorial_workflow(db, topic_id=None, target_audience="Enterprise AI Buyers")
        
        if content:
            logger.success("Pipeline completed successfully!")
            # Verify Fine-Tune Data Collection
            from app.models.fine_tune_data import FineTuneData
            ft_count = db.query(FineTuneData).count()
            print(f"Fine-Tune training pairs collected: {ft_count}")
            
            if ft_count > 0:
                print("Dataset collection: SUCCESS")
            
            # Export test
            from app.utils.export_dataset import export_to_jsonl
            export_to_jsonl("verify_dataset.jsonl")
            
            with open("agent_generated_article.md", "w") as f:
                f.write(content)
            logger.info("Full article saved to agent_generated_article.md")
        else:
            logger.error("Pipeline failed to produce content.")
            
    except Exception as e:
        logger.exception(f"Verification failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(verify_pipeline())
