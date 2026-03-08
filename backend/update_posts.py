import asyncio
import random
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.post import Post
from app.models.trending import Trending
from app.agents.writing.category_agent import CategoryAgent
from app.agents.writing.hashtag_agent import HashtagAgent
from app.agents.writing.voice_agent import VoiceAgent
from app.agents.core.editorial_orchestrator import EditorialOrchestrator
from app.models.task_progress import TaskProgress

async def rerun_failed_posts_and_update_all():
    db = SessionLocal()
    posts = db.query(Post).all()
    
    cat_agent = CategoryAgent()
    hash_agent = HashtagAgent()
    voice_agent = VoiceAgent()
    
    # 1. Update existing blogs
    for post in posts:
        print(f"Updating post {post.id}")
        
        # We need draft content
        current_content = post.content[0] if post.content else ""
        if not current_content:
            continue
            
        state = {
            "draft_content": current_content,
            "topic": post.title[0] if post.title else "",
            "target_audience": "General",
        }
        
        # update voice
        print("Running voice agent...")
        try:
            voice_res = await voice_agent.run(state)
            new_content = voice_res.data.get("final_draft") or state["draft_content"]
            state["final_draft"] = new_content
            post.content = [new_content]
        except Exception as e:
            print(f"Voice failed: {e}")
            
        # Categorization
        print("Running category agent...")
        try:
            cat_res = await cat_agent.run(state)
            post.category = [cat_res.data.get("category", "Intelligence")]
        except Exception as e:
            print(f"Category failed: {e}")
            if not post.category:
                post.category = ["Intelligence"]
            
        # Hashtags
        print("Running hashtag agent...")
        try:
            hash_res = await hash_agent.run(state)
            tags = hash_res.data.get("tags", [])
            post.tags = tags
            seo = post.seo_data or {}
            seo["hashtags"] = tags
            post.seo_data = seo
        except Exception as e:
            print(f"Hashtag failed: {e}")
        
        # Fallback images
        from pprint import pprint
        print("Images:", post.image_crm)
        if not post.image_crm or len(post.image_crm) == 0 or "none" in post.image_crm:
            # Let's use some placeholder random image
            placeholder = f"https://picsum.photos/seed/{post.id}/1200/600"
            post.image_crm = [placeholder]
        
        db.add(post)
        db.commit()

    # 2. Rerun Failed tasks
    failed_tasks = db.query(TaskProgress).filter(TaskProgress.status == 'error').all()
    orchestrator = EditorialOrchestrator()
    for task in failed_tasks:
        print(f"Rerunning failed task {task.task_id}...")
        try:
            task.status = 'running'
            db.add(task)
            db.commit()
            topic_id = task.topic_id
            await orchestrator.run_editorial_workflow(
                db=db, 
                topic_id=topic_id, 
                task_id=task.task_id,
                include_images=False,
                reuse_scrape=True
            )
        except Exception as e:
            print(f"Failed to rerun task {task.task_id}: {e}")
            
    db.close()

if __name__ == "__main__":
    asyncio.run(rerun_failed_posts_and_update_all())
