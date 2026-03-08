import asyncio
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.post import Post
from app.models.task_progress import TaskProgress
from app.agents.writing.category_agent import CategoryAgent
from app.agents.writing.hashtag_agent import HashtagAgent
from app.agents.writing.voice_agent import VoiceAgent

async def run():
    db = SessionLocal()
    posts = db.query(Post).all()
    
    cat_agent = CategoryAgent()
    hash_agent = HashtagAgent()
    voice_agent = VoiceAgent()
    
    for post in posts:
        print(f"Processing Post {post.id} - {post.title[0] if post.title else 'No Title'}")
        
        # We need draft content. Let's use current content as draft
        current_content = post.content[0] if post.content else ""
        if not current_content:
            continue
            
        state = {
            "draft_content": current_content,
            "topic": post.title[0] if post.title else "",
            "target_audience": "General",
        }
        
        # Update voice
        print("Running voice agent...")
        voice_res = await voice_agent.run(state)
        new_content = voice_res.data.get("final_draft") or state["draft_content"]
        state["final_draft"] = new_content
        post.content = [new_content]
        
        # Categorization
        print("Running category agent...")
        cat_res = await cat_agent.run(state)
        post.category = [cat_res.data.get("category", "Intelligence")]
        
        # Hashtags
        print("Running hashtag agent...")
        hash_res = await hash_agent.run(state)
        post.tags = hash_res.data.get("tags", [])
        
        # Setup random image if empty
        if not post.image_crm or len(post.image_crm) == 0:
            post.image_crm = ["images/defaults/post_default.jpg"] # Just an example
            
        # Update seo_data hashtags
        seo = post.seo_data or {}
        seo["hashtags"] = post.tags
        post.seo_data = seo
        
        db.add(post)
        db.commit()
        
    db.close()
    
if __name__ == "__main__":
    asyncio.run(run())
