import asyncio
from app.agents.research.aggregator_agent import AggregatorAgent
from app.db.session import SessionLocal
from app.models.trending import Trending

async def test_aggregator():
    db = SessionLocal()
    topic = "Data Protection Act vs RTI Act India"
    trend = db.query(Trending).filter(Trending.topic == topic).first()
    if not trend:
        trend = Trending(topic=topic, source="Manual", status="Started")
        db.add(trend)
        db.commit()
        db.refresh(trend)
    
    agent = AggregatorAgent()
    result = await agent.run({
        "db": db,
        "trending_id": trend.id,
        "topic": topic
    })
    
    print(f"Status: {result.status}")
    print(f"Feedback: {result.feedback}")
    if result.status == "success":
        rd = result.data.get('research_data', [])
        print(f"Scraped {len(rd)} articles")
        for i, article in enumerate(rd):
            print(f"{i+1}. {article.get('url')[:100]}...")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(test_aggregator())
