from typing import Dict, Any, List
from loguru import logger
import newspaper
from gnews import GNews
from app.agents.core.base_agent import BaseAgent, AgentOutput
from sqlalchemy.orm import Session
from app.models.trending import Trending
from app.models.scrape import Scrape

class AggregatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Research Aggregator Agent",
            rules=[
                "Extract structured facts, statistics, and direct quotes.",
                "Identify contradictions across multiple sources.",
                "Build a coherent fact graph for the writing layer."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        db: Session = input_data.get("db")
        trending_id = input_data.get("trending_id")
        
        if not db or not trending_id:
            return AgentOutput(data={}, status="error", feedback="DB or trending_id missing")

        trending = db.query(Trending).get(trending_id)
        if not trending:
            return AgentOutput(data={}, status="error", feedback="Trending topic not found")

        logger.info(f"AggregatorAgent: Scraping for {trending.topic}")
        try:
            google_news = GNews()
            news_items = google_news.get_news(trending.topic)
            
            research_data = []
            titles, texts, urls = [], [], []
            
            count = 0
            for item in news_items:
                if count >= 10: break
                try:
                    article = newspaper.Article(url=item['url'])
                    article.download()
                    article.parse()
                    
                    titles.append(article.title)
                    texts.append(article.text)
                    urls.append(item['url'])
                    
                    # More granular extraction could happen here
                    research_data.append({
                        "title": article.title,
                        "text": article.text,
                        "url": item['url']
                    })
                    count += 1
                except Exception as e:
                    logger.warning(f"Failed to scrape {item['url']}: {e}")

            if titles:
                scrape = Scrape(
                    trending_id=str(trending.id),
                    title=titles,
                    content=texts,
                    url=urls,
                    status="Scraped"
                )
                db.add(scrape)
                trending.status = "Scraped"
                db.commit()
                db.refresh(scrape)
                
                return AgentOutput(
                    data={
                        "scrape_id": scrape.id,
                        "research_data": research_data,
                        "topic": trending.topic
                    },
                    prompt=f"GNews search for {trending.topic}", # Reconstructed prompt
                    status="success"
                )
            else:
                return AgentOutput(data={}, status="error", feedback="No articles found")
                
        except Exception as e:
            logger.error(f"AggregatorAgent error: {e}")
            return AgentOutput(data={}, status="error", feedback=str(e))
