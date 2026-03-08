import time
import asyncio
from typing import Dict, Any, Callable, Optional
from loguru import logger
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.task_progress import TaskProgress
from app.models.post import Post
from app.models.modular_models import Draft, SEOMetadata
from app.modules.seo.service.semantic_engine import SemanticCoverageEngine

# Import Agents (Legacy Paths)
from app.agents.intelligence.trend_agent import TrendAgent
from app.agents.research.aggregator_agent import AggregatorAgent
from app.agents.research.credibility_agent import CredibilityAgent
from app.agents.strategy.intent_agent import IntentAgent
from app.agents.strategy.keyword_cluster_agent import KeywordClusterAgent
from app.agents.writing.draft_agent import DraftAgent
from app.agents.writing.voice_agent import VoiceAgent
from app.agents.improvement.seo_agent import SEOAgent
from app.agents.improvement.readability_agent import ReadabilityAgent
from app.agents.improvement.originality_agent import OriginalityAgent
from app.agents.governance.legal_agent import LegalAgent
from app.agents.core.evaluator import EvaluationAgent
from app.agents.writing.image_agent import ImageAgent

class PipelineStageLog(BaseModel):
    job_id: str
    agent_name: str
    start_time: float
    end_time: float = 0.0
    status: str
    token_usage: int = 0
    model_used: str = "gemini-1.5-pro"
    cost: float = 0.0
    confidence_score: float = 0.0
    error: Optional[str] = None

class DeterministicPipelineEngine:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.logs = []
        self.state = {}
        self.cost_per_token = 0.0000025 # $2.5 per 1M tokens
        self.agents = {
            "trend": TrendAgent(),
            "aggregator": AggregatorAgent(),
            "credibility": CredibilityAgent(),
            "keyword_cluster": KeywordClusterAgent(),
            "intent": IntentAgent(),
            "draft": DraftAgent(),
            "voice": VoiceAgent(),
            "seo": SEOAgent(),
            "readability": ReadabilityAgent(),
            "originality": OriginalityAgent(),
            "legal": LegalAgent(),
            "evaluator": EvaluationAgent(),
            "image": ImageAgent()
        }

    def _get_db(self):
        return SessionLocal()

    async def run_stage(
        self, 
        agent_key: str, 
        stage_name: str,
        input_data: Dict[str, Any],
        max_retries: int = 1, 
        timeout_seconds: int = 300
    ) -> Dict[str, Any]:
        """
        Runs an isolated pipeline stage with strict timeout, retry loops, and telemetry logging.
        """
        log_entry = PipelineStageLog(
            job_id=self.job_id,
            agent_name=stage_name,
            start_time=float(time.time()),
            status="running"
        )
        
        # Update progress in DB
        db = self._get_db()
        try:
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == self.job_id).first()
            if progress:
                progress.current_step = agent_key
                steps = progress.steps or []
                for s in steps:
                    if s["name"] == agent_key:
                        s["status"] = "running"
                        s["start_time"] = datetime.utcnow().isoformat()
                progress.steps = steps
                db.commit()
            
            agent = self.agents.get(agent_key)
            if not agent:
                raise ValueError(f"Agent {agent_key} not found")

            attempt = 0
            while attempt <= max_retries:
                # Inject DB session into input_data for the agent (re-inject in case of retries)
                input_data["db"] = db
                try:
                    # Run actual agent
                    result = await asyncio.wait_for(agent.run(input_data, context=self.state), timeout=timeout_seconds)
                    
                    if result.status == "success":
                        # Success logic
                        tokens = result.data.get('token_usage', 500)
                        log_entry.token_usage = int(tokens)
                        log_entry.cost = float(tokens * self.cost_per_token)
                        log_entry.end_time = float(time.time())
                        log_entry.status = "success"
                        # Capture confidence score from result data
                        log_entry.confidence_score = result.data.get("confidence_score") or result.data.get("seo_score") or result.data.get("score") or 0.0
                        self.logs.append(log_entry.model_dump())
                        
                        self.state.update(result.data)
                        
                        # Update progress status and persist logs
                        progress = db.query(TaskProgress).filter(TaskProgress.task_id == self.job_id).first()
                        if progress:
                            steps = progress.steps or []
                            for s in steps:
                                if s["name"] == agent_key:
                                    s["status"] = "completed"
                                    s["end_time"] = datetime.utcnow().isoformat()
                            progress.steps = steps
                            progress.logs = self.logs # Persist logs in real-time
                            db.commit()
                        
                        return result.data
                    else:
                        logger.warning(f"{stage_name} returned failure status: {result.feedback}. Attempt {attempt + 1}")
                        attempt += 1
                        if attempt > max_retries:
                            log_entry.error = result.feedback
                
                except asyncio.TimeoutError:
                    logger.warning(f"{stage_name} timed out. Attempt {attempt + 1}")
                    attempt += 1
                    log_entry.error = "Timeout"
                except Exception as e:
                    logger.error(f"{stage_name} exception: {e}. Attempt {attempt + 1}")
                    attempt += 1
                    log_entry.error = str(e)
                finally:
                    # Guaranteed cleanup of non-serializable objects
                    input_data.pop("db", None)

            # If we reach here, retries failed
            log_entry.end_time = float(time.time())
            log_entry.status = "failed"
            self.logs.append(log_entry.model_dump())
            
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == self.job_id).first()
            if progress:
                steps = progress.steps or []
                for s in steps:
                    if s["name"] == agent_key:
                        s["status"] = "failed"
                progress.steps = steps
                progress.status = "error"
                progress.logs = self.logs # Persist final logs
                db.commit()
                
            raise Exception(f"Stage {stage_name} failed definitively: {log_entry.error}")
        finally:
            db.close()

    async def execute_full_pipeline(self, initial_state: dict):
        self.state = initial_state.copy()
        logger.info(f"Starting Deterministic Pipeline for Job ID {self.job_id}")
        
        try:
            # Topic Resolution
            topic = self.state.get("user_topic")
            topic_id = self.state.get("topic_id")
            
            # Resolve Trending Record
            db = self._get_db()
            from app.models.trending import Trending
            try:
                if topic_id:
                    trend = db.query(Trending).get(topic_id)
                    if trend:
                        topic = trend.topic
                elif topic:
                    trend = db.query(Trending).filter(Trending.topic == topic).first()
                    if not trend:
                        trend = Trending(topic=topic, source="Manual", status="Started")
                        db.add(trend)
                        db.commit()
                        db.refresh(trend)
                    topic_id = trend.id
                
                self.state["topic"] = topic
                self.state["trending_id"] = topic_id
            finally:
                db.close()

            # 1. SERP Intelligence / Trend
            if not topic:
                trend_data = await self.run_stage("trend", "Discovery", {"db_bypass": True})
                topic = trend_data.get("trends", [{}])[0].get("topic", "Technology Trends")
                self.state["topic"] = topic
                # Update trending_id if needed here too (omitted for brevity)

            # 2. Aggregator (Research)
            await self.run_stage("aggregator", "Research", {
                "trending_id": self.state.get("trending_id"),
                "topic": self.state.get("topic"),
                "reuse_scrape": self.state.get("reuse_scrape", False)
            })

            # 2b. Credibility Agent (Verification)
            await self.run_stage("credibility", "Credibility Verification", self.state)

            # 3. Strategy Layers
            await self.run_stage("keyword_cluster", "Keyword Analytics", self.state)
            await self.run_stage("intent", "Strategic Architect", self.state)

            # 4. Writing Layers
            await self.run_stage("draft", "Content Synthesis", self.state, timeout_seconds=600)
            await self.run_stage("voice", "Brand Alignment", self.state)
            
            # 4b. Visual Assets
            if self.state.get("include_images"):
                await self.run_stage("image", "Visual Generation", self.state, timeout_seconds=600)

            # 5. Improvement & SEO Coverage
            await self.run_stage("seo", "SEO Compliance", self.state)
            await self.run_stage("readability", "Flow & Clarity", self.state)
            await self.run_stage("originality", "AI Detection Stealth", self.state)
            
            # Semantic Coverage Engine Integration
            engine = SemanticCoverageEngine()
            final_draft = self.state.get("final_draft") or self.state.get("content_with_seo") or self.state.get("draft_content")
            coverage_score = engine.calculate_coverage(
                serp_entities=self.state.get("serp_entities", []),
                draft_content=final_draft,
                draft_vector=None, # In prod, fetch from embedding service
                serp_centroid_vector=None
            )
            self.state["coverage_score"] = coverage_score

            # 6. Governance
            await self.run_stage("legal", "Legal Compliance", self.state)
            await self.run_stage("evaluator", "E-E-A-T Verification", self.state)

            # 7. Persistence
            db = self._get_db()
            try:
                # SEO attributes extraction (check nested seo_data first, then fallback to flat state)
                seo_pack = self.state.get("seo_data", {})
                
                # If meta_description or title are null, try to extract from content body
                # This handles cases where the LLM embeds frontmatter in the text
                ext_title = None
                ext_meta = None
                ext_slug = None
                
                if final_draft:
                    import re
                    t_match = re.search(r'\*{0,2}Title:\*{0,2}\s*(.+)', final_draft, re.I)
                    m_match = re.search(r'\*{0,2}Meta Description:\*{0,2}\s*(.+)', final_draft, re.I)
                    s_match = re.search(r'\*{0,2}URL Slug:\*{0,2}\s*`?([^\s`\n]+)`?', final_draft, re.I)
                    if t_match: ext_title = t_match.group(1).strip()
                    if m_match: ext_meta = m_match.group(1).strip()
                    if s_match: ext_slug = s_match.group(1).strip()

                final_seo_data = {
                    "score": self.state.get("seo_score") or seo_pack.get("score", 75),
                    "coverage_score": self.state.get("coverage_score") or seo_pack.get("coverage_score", 0.0),
                    "focus_keyword": self.state.get("focus_keyword") or seo_pack.get("focus_keyword"),
                    "search_intent": self.state.get("search_intent") or seo_pack.get("search_intent", "informational"),
                    "url_slug": self.state.get("url_slug") or seo_pack.get("url_slug") or ext_slug,
                    "meta_description": self.state.get("meta_description") or seo_pack.get("meta_description") or ext_meta,
                    "title_variants": self.state.get("title_variants") or seo_pack.get("title_variants", []),
                    "hashtags": self.state.get("hashtags") or seo_pack.get("hashtags", []),
                    "coverage_missing": self.state.get("coverage_missing") or seo_pack.get("coverage_missing", []),
                    "internal_link_suggestions": self.state.get("internal_link_suggestions") or seo_pack.get("internal_link_suggestions", [])
                }

                all_imgs = self.state.get("all_images", [])
                cover = self.state.get("cover_image") or (all_imgs[0] if all_imgs else {})

                new_post = Post(
                    title=[ext_title or self.state.get("topic", "Untitled")],
                    content=[final_draft],
                    status="Draft",
                    word_count=len(final_draft.split()) if final_draft else 0,
                    seo_data=final_seo_data,
                    research_sources=self.state.get("verified_research", []),
                    agent_telemetry=self.logs,
                    image_prompt=[cover.get("prompt")] if cover.get("prompt") else [],
                    image_path=[cover.get("file_path")] if cover.get("file_path") else [],
                    image_crm=[cover.get("crm_path")] if cover.get("crm_path") else [],
                    all_image_data=all_imgs
                )
                db.add(new_post)
                db.commit()
                db.refresh(new_post)
                
                # Update progress to completed
                progress = db.query(TaskProgress).filter(TaskProgress.task_id == self.job_id).first()
                if progress:
                    progress.status = "completed"
                    progress.logs = self.logs
                    db.commit()
                    
                return {"post_id": new_post.id, "telemetry": self.logs}
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Pipeline Terminated: {e}")
            raise e
