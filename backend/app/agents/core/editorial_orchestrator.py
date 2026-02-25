from typing import Dict, Any, List, Optional
from loguru import logger
from app.agents.core.orchestrator import Orchestrator
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
from app.agents.core.dataset_agent import DatasetAgent
from app.agents.writing.image_agent import ImageAgent
from app.core.clients import genai_client

class EditorialOrchestrator(Orchestrator):
    def __init__(self):
        super().__init__()
        # Register all agents
        self.register_agent("trend", TrendAgent())
        self.register_agent("aggregator", AggregatorAgent())
        self.register_agent("credibility", CredibilityAgent())
        self.register_agent("keyword_cluster", KeywordClusterAgent())
        self.register_agent("intent", IntentAgent())
        self.register_agent("draft", DraftAgent())
        self.register_agent("voice", VoiceAgent())
        self.register_agent("seo", SEOAgent())
        self.register_agent("readability", ReadabilityAgent())
        self.register_agent("originality", OriginalityAgent())
        self.register_agent("legal", LegalAgent())
        self.register_agent("evaluator", EvaluationAgent())
        self.register_agent("dataset", DatasetAgent())
        self.register_agent("image", ImageAgent())

    async def run_editorial_workflow(self, db, topic_id: Optional[int] = None, user_topic: Optional[str] = None, target_audience: str = "General", task_id: Optional[str] = None, include_images: bool = False, reuse_scrape: bool = False):
        """
        Full 6-layer agentic editorial workflow with dual-mode (Auto/User).
        """
        self.state["db"] = db
        self.state["task_id"] = task_id
        self.state["target_audience"] = target_audience

        # Workflow Selection
        if user_topic:
            # Workflow B: User-Initiated Topic Mode
            logger.info(f"Orchestrator: Running Workflow B for topic '{user_topic}'")
            self.state["topic"] = user_topic
            
            # Ensure Trending record exists
            from app.models.trending import Trending
            trend = db.query(Trending).filter(Trending.topic == user_topic).first()
            if not trend:
                trend = Trending(topic=user_topic, source="Manual", status="Started")
                db.add(trend)
                db.commit()
                db.refresh(trend)
            topic_id = trend.id
            # (Keyword cluster + SERP blueprint handled by dedicated agents below)
        elif topic_id:
            # Workflow A/B hybrid: User selected from Trends
            from app.models.trending import Trending
            trend = db.query(Trending).get(topic_id)
            self.state["topic"] = trend.topic if trend else f"Topic {topic_id}"
            logger.info(f"Orchestrator: Running Workflow B for existing trend '{self.state['topic']}'")
        else:
            # Workflow A: Fully Autonomous Mode
            logger.info("Orchestrator: Running Workflow A (Fully Autonomous)")
            trend_result = await self.execute_task("trend", {"db": db})
            if trend_result.status != "success": return None
            
            # Select top-scoring trend
            trends = trend_result.data.get("trends", [])
            if not trends: return None
            selected = sorted(trends, key=lambda x: x.get("score", 0), reverse=True)[0]
            self.state["topic"] = selected.get("topic")
            topic_id = selected.get("id")

        # Layer 2: Research
        research_result = await self.execute_task("aggregator", {
            "db": db,
            "trending_id": topic_id,
            "topic": self.state["topic"],
            "reuse_scrape": reuse_scrape  # Pass the flag into the agent
        })
        self.state["research_data"] = research_result.data.get("research_data", [])
        await self.execute_task("credibility", self.state)
        
        # UI SCAFFOLDING: Update Fact Count
        if task_id:
            from app.models.task_progress import TaskProgress
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
            if progress:
                preview = progress.preview_data or {}
                preview["fact_count"] = len(self.state["research_data"])
                progress.preview_data = preview
                db.commit()

        # Layer 3: Strategy — Keyword Cluster first, then SERP Blueprint
        await self.execute_task("keyword_cluster", self.state)
        
        # UI SCAFFOLDING: Update primary keyword in preview
        if task_id:
            from app.models.task_progress import TaskProgress
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
            if progress:
                preview = progress.preview_data or {}
                preview["primary_keyword"] = self.state.get("primary_keyword", self.state.get("topic"))
                preview["search_intent"] = self.state.get("search_intent", "informational")
                progress.preview_data = preview
                db.commit()

        await self.execute_task("intent", self.state)
        
        # UI SCAFFOLDING: Update Headline
        if task_id:
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
            if progress:
                preview = progress.preview_data or {}
                preview["headline"] = self.state.get("topic")
                progress.preview_data = preview
                db.commit()

        # Layer 4: Writing (Now with 1200+ word enforcement)
        await self.execute_task("draft", self.state)
        
        # UI SCAFFOLDING: Update Outline Preview
        if task_id:
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
            if progress:
                preview = progress.preview_data or {}
                # Extract first 3 lines as outline preview
                draft = self.state.get("draft_content", "")
                preview["outline"] = "\n".join(draft.split("\n")[:3]) + "..."
                progress.preview_data = preview
                db.commit()

        await self.execute_task("voice", self.state)
        
        if include_images:
            await self.execute_task("image", self.state)
        else:
            logger.info("Orchestrator: Skipping image generation per user request.")

        # Layer 5: Improvement
        await self.execute_task("seo", self.state)
        await self.execute_task("readability", self.state)
        await self.execute_task("originality", self.state)

        # Layer 6: Governance
        await self.execute_task("legal", self.state)
        eval_result = await self.execute_task("evaluator", self.state)
        
        # PERSISTENCE: Save to DB as Post with Premium Metadata
        from app.models.post import Post
        final_draft = self.state.get("final_draft") or self.state.get("content_with_seo") or self.state.get("draft_content")
        word_count = len(final_draft.split()) if final_draft else self.state.get("word_count", 0)
        
        # Grab SEO Agent Output
        seo_extracted = self.state.get("seo_data", {})
        focus_meta = seo_extracted.get("focus_keyword", self.state.get("topic"))
        hashtags = seo_extracted.get("hashtags", [])
        seo_score = seo_extracted.get("score", eval_result.data.get("score", 85))
        
        if final_draft:
            new_post = Post(
                title=[self.state.get("topic", "Untitled Article")],
                content=[final_draft],
                status="Draft",
                word_count=word_count,
                seo_data={
                    "focus_keyword": focus_meta,
                    "hashtags": hashtags,
                    "word_count": word_count,
                    "score": seo_score
                },
                research_sources=self.state.get("research_data", []),
                meta=str(eval_result.data.get("critique", "Verification Passed"))
            )
            db.add(new_post)
            try:
                db.commit()
                db.refresh(new_post)
                logger.success(f"Orchestrator: Long-form article saved (ID: {new_post.id}, Words: {word_count})")
                
                # Mark entire task as completed
                if task_id:
                    from app.models.task_progress import TaskProgress
                    progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
                    if progress:
                        preview = progress.preview_data or {}
                        preview["seo_score"] = seo_score
                        progress.preview_data = preview
                        progress.status = "completed"
                        db.commit()

                self.state["final_publish_ready_content"] = {
                    "id": new_post.id,
                    "title": new_post.title[0],
                    "content": new_post.content[0],
                    "word_count": word_count
                }
            except Exception as e:
                db.rollback()
                logger.error(f"Orchestrator save error: {e}")

        return self.state.get("final_publish_ready_content")
