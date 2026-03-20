import asyncio
from typing import Dict, Any, List, Optional
from loguru import logger
from app.agents.core.orchestrator import Orchestrator
from app.agents.intelligence.trend_agent import TrendAgent
from app.agents.research.aggregator_agent import AggregatorAgent
from app.agents.research.credibility_agent import CredibilityAgent
from app.agents.strategy.intent_agent import IntentAgent
from app.agents.strategy.keyword_cluster_agent import KeywordClusterAgent
from app.agents.writing.writer_agent import WriterAgent
from app.agents.writing.voice_agent import VoiceAgent
from app.agents.improvement.seo_agent import SEOAgent
from app.agents.improvement.readability_agent import ReadabilityAgent
from app.agents.improvement.originality_agent import OriginalityAgent
from app.agents.governance.legal_agent import LegalAgent
from app.agents.writing.category_agent import CategoryAgent
from app.agents.writing.hashtag_agent import HashtagAgent
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
        self.register_agent("writer", WriterAgent())
        self.register_agent("voice", VoiceAgent())
        self.register_agent("seo", SEOAgent())
        self.register_agent("readability", ReadabilityAgent())
        self.register_agent("originality", OriginalityAgent())
        self.register_agent("legal", LegalAgent())
        self.register_agent("evaluator", EvaluationAgent())
        self.register_agent("dataset", DatasetAgent())
        self.register_agent("image", ImageAgent())
        self.register_agent("category", CategoryAgent())
        self.register_agent("hashtag", HashtagAgent())

    async def run_editorial_workflow(self, db, topic_id: Optional[int] = None, user_topic: Optional[str] = None, target_audience: str = "General", task_id: Optional[str] = None, include_images: bool = False, reuse_scrape: bool = False):
        """
        Full 6-layer agentic editorial workflow with parallel execution and Dataset integration.
        """
        self.state["db"] = db
        self.state["task_id"] = task_id
        self.state["target_audience"] = target_audience

        # --- Layer 1: Discovery ---
        if user_topic:
            logger.info(f"Orchestrator: Manual Topic Mode -> '{user_topic}'")
            self.state["topic"] = user_topic
            from app.models.trending import Trending
            trend = db.query(Trending).filter(Trending.topic == user_topic).first()
            if not trend:
                trend = Trending(topic=user_topic, source="Manual", status="Started")
                db.add(trend)
                db.commit()
                db.refresh(trend)
            topic_id = trend.id
        elif topic_id:
            from app.models.trending import Trending
            trend = db.query(Trending).get(topic_id)
            self.state["topic"] = trend.topic if trend else f"Topic {topic_id}"
        else:
            logger.info("Orchestrator: Fully Autonomous Discovery")
            trend_result = await self.execute_task("trend", {"db": db})
            if trend_result.status != "success": return None
            trends = trend_result.data.get("trends", [])
            if not trends: return None
            selected = sorted(trends, key=lambda x: x.get("score", 0), reverse=True)[0]
            self.state["topic"] = selected.get("topic")
            topic_id = selected.get("id")

        # --- Layer 1.5: Image Reuse Detection ---
        from app.models.post import Post as PostModel
        # Check if a post with this topic already exists and has an image
        existing_post = db.query(PostModel).filter(PostModel.title.contains([self.state["topic"]])).order_by(PostModel.created_at.desc()).first()
        if existing_post and existing_post.image_crm:
            logger.info(f"Orchestrator: Detected existing images for topic '{self.state['topic']}'. Reusing.")
            self.state["image"] = {"image_crm": existing_post.image_crm, "reused": True}

        # --- Layer 2: Research ---
        research_result = await self.execute_task("aggregator", {
            "db": db,
            "trending_id": topic_id,
            "topic": self.state["topic"],
            "reuse_scrape": reuse_scrape
        })
        self.state["research_data"] = research_result.data.get("research_data", [])
        credibility_result = await self.execute_task("credibility", self._get_flattened_state())
        
        # Adopt Fresh Topic from Research if available
        if credibility_result.status == "success":
            refined = credibility_result.data.get("refined_topic")
            if refined and len(refined) > 5:
                logger.info(f"Orchestrator: Updating topic from '{self.state['topic']}' to REFINED -> '{refined}'")
                self.state["topic"] = refined
        
        # Dataset Deep Dive (trigger for data-heavy niches)
        topic_lower = self.state["topic"].lower()
        if any(token in topic_lower for token in ["science", "finance", "crypto", "data", "tech", "market", "economy"]):
            logger.info("Orchestrator: Data-heavy topic detected. Triggering DatasetAgent.")
            await self.execute_task("dataset", self._get_flattened_state())

        if task_id:
            from app.models.task_progress import TaskProgress
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
            if progress:
                preview = dict(progress.preview_data or {})
                preview["fact_count"] = len(self.state.get("research_data", []))
                progress.preview_data = preview
                db.commit()

        # --- Layer 3: Strategy ---
        await self.execute_task("keyword_cluster", self._get_flattened_state())
        await self.execute_task("intent", self._get_flattened_state())
        
        if task_id:
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
            if progress:
                preview = dict(progress.preview_data or {})
                preview["primary_keyword"] = self.state.get("keyword_cluster", {}).get("primary_keyword", self.state["topic"])
                preview["search_intent"] = self.state.get("intent", {}).get("search_intent", "informational")
                preview["headline"] = self.state["topic"]
                progress.preview_data = preview
                db.commit()

        # --- Layer 4: Creation ---
        await self.execute_task("writer", self._get_flattened_state())
        await self.execute_task("voice", self._get_flattened_state())
        
        if include_images:
            # Only generate if we don't already have one in the state (reuse mode)
            if "image" not in self.state:
                await self.execute_task("image", self._get_flattened_state())
            else:
                logger.info("Orchestrator: Skipping ImageAgent due to existing image reuse.")

        if task_id:
            progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
            if progress:
                preview = dict(progress.preview_data or {})
                voice_data = self.state.get("voice", {})
                draft = voice_data.get("final_draft", "") if isinstance(voice_data, dict) else ""
                preview["outline"] = "\n".join(str(draft).split("\n")[:3]) + "..."
                progress.preview_data = preview
                db.commit()

        # --- Layer 5: Improvement (Parallel execution) ---
        logger.info("Orchestrator: Executing Layer 5 Improvement Agents in Parallel")
        current_context = self._get_flattened_state()
        await asyncio.gather(
            self.execute_task("seo", current_context),
            self.execute_task("readability", current_context),
            self.execute_task("originality", current_context)
        )
        
        # Categorization & Social Tags (Parallel)
        await asyncio.gather(
            self.execute_task("category", current_context),
            self.execute_task("hashtag", current_context)
        )

        # --- Layer 6: Governance ---
        await self.execute_task("legal", self._get_flattened_state())
        eval_result = await self.execute_task("evaluator", self._get_flattened_state())
        
        # --- PERSISTENCE ---
        from app.models.post import Post
        f_state = self._get_flattened_state()
        final_draft = f_state.get("final_draft") or f_state.get("content_with_seo") or f_state.get("draft_content")
        
        if not final_draft:
            logger.error("Orchestrator: Critical failure - no draft generated.")
            return None

        word_count = len(final_draft.split())
        seo_data = f_state.get("seo_data", {})
        
        # Prepare Clean Telemetry for UI
        telemetry = []
        for entry in self.history:
            agent_name = entry.get("agent")
            output_data = entry.get("output", {}).get("data", {})
            
            # Extract confidence score from namespaced data
            conf = output_data.get("confidence_score")
            if conf is None:
                # Fallback extraction from deep nesting
                for val in output_data.values():
                    if isinstance(val, dict) and "confidence_score" in val:
                        conf = val["confidence_score"]
                        break
            
            # Additional metrics if available
            metrics = entry.get("output", {}).get("metrics", {})
            
            telemetry.append({
                "agent_name": agent_name,
                "status": entry.get("output", {}).get("status", "success"),
                "confidence_score": conf or entry.get("output", {}).get("metrics", {}).get("confidence_score") or 0,
                "start_time": None, 
                "end_time": None,
                "model_used": "Gemini 1.5 Pro"
            })

        image_crm_val = f_state.get("image_crm") or f_state.get("image", {}).get("image_crm", [])
        if isinstance(image_crm_val, str):
            image_crm_val = [image_crm_val]

        new_post = Post(
            title=[self.state["topic"]],
            content=[final_draft],
            status="Draft",
            word_count=word_count,
            category=[f_state.get("primary_category", "Intelligence")],
            tags=f_state.get("tags", []),
            image_crm=image_crm_val,
            seo_data={
                "focus_keyword": seo_data.get("focus_keyword", self.state["topic"]),
                "hashtags": f_state.get("tags", []),
                "score": seo_data.get("score", eval_result.data.get("score", 0)),
                "readability_score": f_state.get("readability_score", 0)
            },
            research_sources=self.state.get("research_data", []),
            agent_telemetry=telemetry,
            meta=str(eval_result.data.get("critique", "Verification Passed"))
        )
        
        db.add(new_post)
        try:
            db.commit()
            db.refresh(new_post)
            
            if task_id:
                progress = db.query(TaskProgress).filter(TaskProgress.task_id == task_id).first()
                if progress:
                    preview = dict(progress.preview_data or {})
                    preview["seo_score"] = seo_data.get("score", 0)
                    progress.preview_data = preview
                    progress.status = "completed"
                    db.commit()

            return {
                "id": new_post.id,
                "title": new_post.title[0],
                "word_count": word_count
            }
        except Exception as e:
            db.rollback()
            logger.error(f"Orchestrator Save Error: {e}")
            return None

