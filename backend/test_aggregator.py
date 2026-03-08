import asyncio
from app.agents.research.aggregator_agent import AggregatorAgent
from app.db.session import SessionLocal
from app.models.trending import Trending

async def test_aggregator():
    db = SessionLocal()
    topic = "Does the Data Act dilute the Right to Information Act?"
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
        print(f"Scraped {len(result.data.get('research_data', []))} articles")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(test_aggregator())
