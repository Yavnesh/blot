from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.trending import Trending
from app.models.scrape import Scrape
from app.models.post import Post
import datetime

def populate_sample_data():
    db = SessionLocal()
    try:
        # Clear existing
        db.query(Post).delete()
        db.query(Scrape).delete()
        db.query(Trending).delete()

        # 1. Sample Topics
        topics = [
            Trending(topic="Rise of Agentic AI in Enterprise", source="LLM Fallback", status="New", related_topics_top=["Automation", "Workflow", "Efficiency"]),
            Trending(topic="Sustainable Tech Trends 2026", source="LLM Fallback", status="Saved", related_topics_top=["Clean Energy", "ESG", "Hardware"]),
            Trending(topic="The Future of Remote Collaboration", source="LLM Fallback", status="New", related_topics_top=["VR", "Spatial Computing", "Teams"])
        ]
        db.add_all(topics)
        db.flush()

        # 2. Sample Scrapes
        scrapes = [
            Scrape(url=["https://techcrunch.com/agentic-ai"], title=["Rise of Agents"], content=["Full analysis of agentic workflows..."], trending_id=str(topics[0].id)),
            Scrape(url=["https://wired.com/future-of-work"], title=["Work 2026"], content=["Remote work trends in 2026 report..."], trending_id=str(topics[2].id))
        ]
        db.add_all(scrapes)

        # 3. Sample Posts
        posts = [
            Post(title=["Why Agentic AI is the Next Big Thing"], content=["<h1>The Dawn of Agents</h1><p>Agentic AI is more than just chatbots. It's about execution...</p>"], status="Published"),
            Post(title=["Top 5 Sustainable Tech Innovations"], content=["<h1>Green Tech 2026</h1><p>From hydrogen cells to carbon capture...</p>"], status="Draft")
        ]
        db.add_all(posts)

        db.commit()
        print("Sample data populated successfully.")
    except Exception as e:
        print(f"Error populating data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_sample_data()
