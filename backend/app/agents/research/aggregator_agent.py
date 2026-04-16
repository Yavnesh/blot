import asyncio
import uuid
import json
import httpx
from datetime import datetime
from typing import Dict, Any, List, Optional
from loguru import logger
import newspaper
from gnews import GNews
from pydantic import BaseModel
from tavily import TavilyClient

from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client
from app.core.config import settings
from app.core.redis import redis_client
from sqlalchemy.orm import Session
from app.models.trending import Trending
from app.models.scrape import Scrape

class FactClaim(BaseModel):
    claim: str
    statistic: str
    source_url: str

class FactGraphSchema(BaseModel):
    key_facts: List[FactClaim]

GLOBAL_TRUSTED_SOURCES = [
    # Global General News (Verified & Reliable)
    "reuters.com", "apnews.com", "bloomberg.com", 
    "economist.com", "ft.com", "wsj.com", 
    "bbc.com", "theguardian.com", "nytimes.com",
    # Industry Specific (Tech & Business)
    "techcrunch.com", "venturebeat.com", "technologyreview.com",
    "arstechnica.com", "wired.com", "theverge.com",
    "engadget.com", "mashable.com", "fastcompany.com"
]

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
        self.tavily = TavilyClient(api_key=settings.TAVILY_API_KEY) if settings.TAVILY_API_KEY else None

    async def _check_tavily_credits(self) -> bool:
        """
        Check if we've exceeded the 950 credits monthly safety limit.
        Stored in Redis as tavily_usage:YYYY-MM
        """
        if not self.tavily:
            return False
            
        month_key = f"tavily_usage:{datetime.now().strftime('%Y-%m')}"
        usage = await redis_client.get(month_key)
        if usage and int(usage) >= 950:
            logger.warning(f"Tavily monthly limit reached ({usage}/950). Switching to fallback mode.")
            return False
        return True

    async def _increment_tavily_usage(self, count: int = 1):
        month_key = f"tavily_usage:{datetime.now().strftime('%Y-%m')}"
        await redis_client.incrby(month_key, count)

    async def _resolve_url(self, client: httpx.AsyncClient, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parallel-ready URL resolver with safety checks."""
        url = item.get('url')
        try:
            resp = await client.get(url, timeout=5.0)
            resolved_url = str(resp.url)
            
            # Validation: discard dead redirects
            if "google.com/news/rss" in resolved_url:
                return None
                
            return {
                "title": item.get("title", "Untitled"),
                "url": resolved_url,
                "published_date": item.get("published date")
            }
        except Exception as e:
            logger.debug(f"Failed to resolve {url}: {e}")
            return None

    async def _scrape_article(self, client: httpx.AsyncClient, item: Dict[str, Any]) -> Optional[Dict[str, str]]:
        """Parallel-ready scraper with newspaper3k fallback."""
        url = item['url']
        try:
            config = newspaper.Config()
            config.browser_user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            config.request_timeout = 8
            
            article = newspaper.Article(url=url, config=config)
            article.download()
            article.parse()
            
            text = article.text
            # Minimum Threshold: If < 200 chars, try one manual fetch
            if not text or len(text) < 200:
                resp = await client.get(url, timeout=10.0)
                if resp.status_code == 200:
                    article.set_html(resp.text)
                    article.parse()
                    text = article.text
            
            if text and len(text) >= 200:
                return {
                    "title": article.title or item.get('title'),
                    "text": text,
                    "url": url
                }
        except Exception as e:
            logger.warning(f"Failed to scrape {url}: {e}")
        return None

    async def _fetch_from_tavily(self, topic: str, search_depth: str = "basic") -> List[Dict[str, str]]:
        """The Fail-Safe: Tavily API search with AI-optimized News filter."""
        if not self.tavily or not await self._check_tavily_credits():
            return []
            
        logger.info(f"Waterfall Fallback: Triggering Tavily News for '{topic}'")
        try:
            loop = asyncio.get_event_loop()
            search_result = await loop.run_in_executor(
                None, 
                lambda: self.tavily.search(
                    query=topic,
                    search_depth=search_depth,
                    topic="news",  # AI-curated news filter
                    days=7,        # Freshness filter
                    include_raw_content=True,
                    max_results=5
                )
            )
            
            await self._increment_tavily_usage(1)
            
            results = []
            for res in search_result.get('results', []):
                content = res.get('raw_content') or res.get('content')
                if content and len(content) > 200:
                    results.append({
                        "title": res.get('title', 'Tavily News Result'),
                        "text": content,
                        "url": res.get('url')
                    })
            return results
        except Exception as e:
            logger.error(f"Tavily search failed: {e}")
            return []

    async def _execute(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        db: Session = input_data.get("db")
        org_id = input_data.get("org_id", 1)
        trending_id = input_data.get("trending_id")
        reuse_scrape: bool = input_data.get("reuse_scrape", False)
        topic_name = input_data.get("user_topic")

        if not db:
            return AgentOutput(data={}, status="error", feedback="DB connection missing")
            
        trending = db.query(Trending).get(trending_id) if trending_id else None
        topic_name = topic_name or (trending.topic if trending else None)
        
        if not topic_name:
            return AgentOutput(data={}, status="error", feedback="No topic name provided")

        # ──────────────────────────────────────────────────────────────────────
        # STEP 1: CACHE CHECK (Waterfall Phase 1)
        # ──────────────────────────────────────────────────────────────────────
        if reuse_scrape and trending:
            existing_scrape = db.query(Scrape).filter(
                Scrape.trending_id == str(trending.id), 
                Scrape.status == "RESEARCH_COMPLETE"
            ).order_by(Scrape.id.desc()).first()
            
            if existing_scrape and existing_scrape.title:
                logger.info(f"Waterfall: Reusing cached scrape #{existing_scrape.id}")
                research_data = []
                for i in range(len(existing_scrape.title)):
                    research_data.append({
                        "title": existing_scrape.title[i],
                        "text": existing_scrape.content[i],
                        "url": existing_scrape.url[i]
                    })
                return AgentOutput(
                    data={
                        "scrape_id": existing_scrape.id,
                        "research_data": research_data,
                        "fact_graph": {"key_facts": []},
                        "topic": topic_name,
                        "source": "cache"
                    },
                    status="success"
                )

        # ──────────────────────────────────────────────────────────────────────
        # STEP 2: GNEWS + DOMAIN AUTHORITY QUERY (Waterfall Phase 2)
        # ──────────────────────────────────────────────────────────────────────
        logger.info(f"Waterfall: Starting Domain-Authority Search (GNews) for '{topic_name}'")
        research_data = []
        source_label = "gnews"
        
        try:
            # Construct Google-compliant search operator string using top 6 trusted domains
            authority_sites = " OR ".join([f"site:{domain}" for domain in GLOBAL_TRUSTED_SOURCES[:6]])
            authority_query = f"{topic_name} ({authority_sites})"
            
            google_news = GNews(max_results=10, language='en', country='US')
            logger.info(f"Aggregator Query: {authority_query}")
            news_items = google_news.get_news(authority_query)
            
            # If GNews with authority sites fails, try a broader search once before falling back to Tavily
            if not news_items:
                logger.info("Narrow GNews search failed. Trying broad GNews search.")
                news_items = google_news.get_news(topic_name)

            if news_items:
                async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
                    # Parallel URL Resolution
                    resolve_tasks = [self._resolve_url(client, item) for item in news_items]
                    resolved_items = await asyncio.gather(*resolve_tasks)
                    valid_items = [item for item in resolved_items if item]
                    
                    # Parallel Scraping
                    scrape_tasks = [self._scrape_article(client, item) for item in valid_items[:8]]
                    scraped_results = await asyncio.gather(*scrape_tasks)
                    research_data = [res for res in scraped_results if res]

            # ──────────────────────────────────────────────────────────────────
            # STEP 3: TAVILY NEWS FALLBACK (Waterfall Phase 3)
            # ──────────────────────────────────────────────────────────────────
            if len(research_data) < 3:
                logger.info(f"Waterfall: Priority Search under-performed. Triggering Tavily AI News.")
                tavily_results = await self._fetch_from_tavily(topic_name)
                if tavily_results:
                    source_label = "tavily" if not research_data else "hybrid"
                    research_data.extend(tavily_results)

            if not research_data:
                return AgentOutput(data={}, status="error", feedback="No articles found from trusted publishers")

            # ──────────────────────────────────────────────────────────────────
            # STEP 4: FACT GRAPH EXTRACTION
            # ──────────────────────────────────────────────────────────────────
            fact_graph_data = {"key_facts": []}
            combined_texts = "\n\n---\n\n".join([f"Source: {rd['url']}\nContent: {rd['text'][:1200]}" for rd in research_data])
            fact_prompt = f"Extract a structured list of claims and statistics from this research:\n\n{combined_texts}"
            
            try:
                response = await genai_client.generate_structured(fact_prompt, output_schema=FactGraphSchema)
                fact_graph_data = json.loads(genai_client.extract_pre_post_content(response))
            except Exception as e:
                logger.error(f"Fact graph extraction failed: {e}")

            # ──────────────────────────────────────────────────────────────────
            # STEP 5: ATOMIC DB UPDATES
            # ──────────────────────────────────────────────────────────────────
            scrape = Scrape(
                org_id=org_id,
                title=[rd['title'] for rd in research_data],
                content=[rd['text'] for rd in research_data],
                url=[rd['url'] for rd in research_data],
                status="RESEARCH_COMPLETE",
                source=source_label,
                trending_id=str(trending.id) if trending else None
            )
            db.add(scrape)
            if trending:
                trending.status = "RESEARCH_COMPLETE"
            db.commit()
            db.refresh(scrape)

            return AgentOutput(
                data={
                    "scrape_id": scrape.id,
                    "research_data": research_data,
                    "fact_graph": fact_graph_data,
                    "topic": topic_name,
                    "source": source_label
                },
                status="success"
            )

        except Exception as e:
            db.rollback()
            logger.error(f"AggregatorAgent Waterfall Error: {e}")
            return AgentOutput(data={}, status="error", feedback=str(e))

