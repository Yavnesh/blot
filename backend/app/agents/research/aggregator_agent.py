from typing import Dict, Any, List, Optional
import json
import httpx
from loguru import logger
import newspaper
from gnews import GNews
from pydantic import BaseModel
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client
from sqlalchemy.orm import Session
from app.models.trending import Trending
from app.models.scrape import Scrape

class FactClaim(BaseModel):
    claim: str
    statistic: str
    source_url: str

class FactGraphSchema(BaseModel):
    key_facts: List[FactClaim]

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

    async def run(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
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
                .filter(Scrape.trending_id == str(trending.id), Scrape.status == "RESEARCH_COMPLETE")
                .order_by(Scrape.id.desc())
                .first()
            )
            if existing_scrape and existing_scrape.title:
                logger.info(f"AggregatorAgent: Reusing cached scrape #{existing_scrape.id} for '{trending.topic}' — skipping GNews.")
                research_data = []
                titles = list(existing_scrape.title or [])
                texts = list(existing_scrape.content or [])
                urls = list(existing_scrape.url or [])
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
                        "fact_graph": {"key_facts": []},
                        "topic": str(trending.topic),
                        "source": "cache",
                        "confidence_score": 100.0
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

            # 2. Optimized "site:" Search Loop
            sites_query = " OR ".join([f"site:{site}" for site in top_tech_sites])
            topics_to_search = [
                str(trending.topic), 
                f"{trending.topic} ({sites_query})"
            ]

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
            
            # 1. The GNews Redirect Trap resolution via httpx
            with httpx.Client(follow_redirects=True, timeout=10.0) as http_client:
                for item in filtered_news_items:
                    if count >= 15:
                        break
                    try:
                        source_url = str(item.get('url'))
                        try:
                            # Resolve the redirect accurately before feeding to newspaper
                            head_res = http_client.head(source_url)
                            source_url = str(head_res.url)
                        except Exception as req_e:
                            logger.warning(f"Failed to resolve GNews redirect for {source_url}: {req_e}")

                        # Use publisher href safely as fallback if needed downstream
                        publisher_href = ""
                        if item.get('publisher') and 'href' in item['publisher']:
                            publisher_href = str(item['publisher']['href'])

                        article = newspaper.Article(url=source_url)
                        article.download()
                        article.parse()

                        final_url = article.url if article.url and not "news.google.com" in article.url else source_url
                        
                        if "news.google.com" in final_url and publisher_href:
                            final_url = publisher_href

                        titles.append(str(article.title))
                        texts.append(str(article.text))
                        urls.append(str(final_url))

                        research_data.append({
                            "title": str(article.title),
                            "text": str(article.text),
                            "url": str(final_url)
                        })
                        count += 1
                    except Exception as e:
                        logger.warning(f"Failed to scrape {item.get('url')}: {e}")

            # 4. The "Fact Graph" Extraction Logic 
            fact_graph_data = {"key_facts": []}
            if research_data:
                logger.info("AggregatorAgent: Extracting Fact Graph from newly scraped content")
                combined_texts = "\n\n---\n\n".join([f"Source: {rd['url']}\nContent: {rd['text'][:1000]}" for rd in research_data])
                fact_prompt = f"Extract a list of claims and statistics from the following research data:\n\n{combined_texts}"
                
                try:
                    response = genai_client.generate_structured(fact_prompt, output_schema=FactGraphSchema)
                    if isinstance(response, genai_client.MockResponse):
                        fact_graph_data = json.loads(response.text)
                    else:
                        fact_graph_data = json.loads(str(response.text))
                except Exception as eval_e:
                    logger.error(f"Failed to generate fact graph: {eval_e}")

            if titles:
                # 3. Database State updates to granular RESEARCH_COMPLETE
                scrape = Scrape(
                    trending_id=str(trending.id),
                    title=titles,
                    content=texts,
                    url=urls,
                    status="RESEARCH_COMPLETE"
                )
                db.add(scrape)
                trending.status = "RESEARCH_COMPLETE"
                db.commit()
                db.refresh(scrape)

                return AgentOutput(
                    data={
                        "scrape_id": scrape.id,
                        "research_data": research_data,
                        "fact_graph": fact_graph_data,
                        "topic": str(trending.topic),
                        "source": "fresh",
                        "confidence_score": 90.0
                    },
                    prompt=f"GNews search for {trending.topic}",
                    status="success"
                )
            else:
                return AgentOutput(data={}, status="error", feedback="No articles found")

        except Exception as e:
            logger.error(f"AggregatorAgent error: {e}")
            return AgentOutput(data={}, status="error", feedback=str(e))
