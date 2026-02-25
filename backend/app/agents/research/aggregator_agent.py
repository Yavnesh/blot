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
                "Build a coherent fact graph for the writing layer.",
                "Reuse cached Scrape records when reuse_scrape=True to avoid redundant API calls."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        db: Session = input_data.get("db")
        trending_id = input_data.get("trending_id")
        reuse_scrape: bool = input_data.get("reuse_scrape", False)

        if not db or not trending_id:
            return AgentOutput(data={}, status="error", feedback="DB or trending_id missing")

        trending = db.query(Trending).get(trending_id)
        if not trending:
            return AgentOutput(data={}, status="error", feedback="Trending topic not found")

        # ──────────────────────────────────────────────────────────────────────
        # CACHE PATH: Reuse existing Scrape record for this trending topic
        # ──────────────────────────────────────────────────────────────────────
        if reuse_scrape:
            existing_scrape = (
                db.query(Scrape)
                .filter(Scrape.trending_id == str(trending.id), Scrape.status == "Scraped")
                .order_by(Scrape.id.desc())
                .first()
            )
            if existing_scrape and existing_scrape.title:
                logger.info(f"AggregatorAgent: Reusing cached scrape #{existing_scrape.id} for '{trending.topic}' — skipping GNews.")
                research_data = []
                titles = existing_scrape.title or []
                texts = existing_scrape.content or []
                urls = existing_scrape.url or []
                for i in range(len(titles)):
                    research_data.append({
                        "title": titles[i] if i < len(titles) else "Unknown",
                        "text": texts[i] if i < len(texts) else "",
                        "url": urls[i] if i < len(urls) else ""
                    })
                return AgentOutput(
                    data={
                        "scrape_id": existing_scrape.id,
                        "research_data": research_data,
                        "topic": trending.topic,
                        "source": "cache"
                    },
                    prompt=f"Reused cached scrape for {trending.topic}",
                    status="success"
                )
            else:
                logger.warning(f"AggregatorAgent: reuse_scrape=True but no cached data found for '{trending.topic}'. Falling back to fresh scrape.")

        # ──────────────────────────────────────────────────────────────────────
        # FRESH SCRAPE PATH: Hit GNews + newspaper3k
        # ──────────────────────────────────────────────────────────────────────
        logger.info(f"AggregatorAgent: Fresh scraping for '{trending.topic}'")
        try:
            google_news = GNews(max_results=5)

            # Include main topic and specific credible tech sites
            top_tech_sites = [
                "techcrunch.com", "venturebeat.com", "technologyreview.com",
                "arstechnica.com", "wired.com", "theverge.com",
                "engadget.com", "mashable.com", "fastcompany.com"
            ]

            topics_to_search = [trending.topic]
            for site in top_tech_sites:
                topics_to_search.append(f"{trending.topic} site:{site}")

            news_items = []
            for q in topics_to_search:
                items = google_news.get_news(q)
                if items:
                    news_items.extend(items)

            # Deduplicate by url
            unique_urls = set()
            filtered_news_items = []
            for item in news_items:
                if item['url'] not in unique_urls:
                    unique_urls.add(item['url'])
                    filtered_news_items.append(item)

            research_data = []
            titles, texts, urls = [], [], []

            count = 0
            for item in filtered_news_items:
                if count >= 15:
                    break
                try:
                    article = newspaper.Article(url=item['url'])
                    article.download()
                    article.parse()

                    titles.append(article.title)
                    texts.append(article.text)
                    urls.append(item['url'])

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
                        "topic": trending.topic,
                        "source": "fresh"
                    },
                    prompt=f"GNews search for {trending.topic}",
                    status="success"
                )
            else:
                return AgentOutput(data={}, status="error", feedback="No articles found")

        except Exception as e:
            logger.error(f"AggregatorAgent error: {e}")
            return AgentOutput(data={}, status="error", feedback=str(e))
