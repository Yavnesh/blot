from typing import Dict, Any, List, Optional
import json
from loguru import logger
from pydantic import BaseModel
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class StrategySchema(BaseModel):
    hook: str
    angle: str
    story_structure: str
    cta: str
    visual_style: str

class InstagramStrategyAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Instagram Strategy Agent",
            rules=[
                "Formulate a highly compelling, platform-native Instagram content angle.",
                "Prioritize high-retention hooks that disrupt the user's scroll.",
                "Structure a clear narrative flow adapted for carousel slides or single posts.",
                "Define a cohesive visual aesthetic style for image generators to reference."
            ]
        )

    async def _execute(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        verified_research = input_data.get("verified_research", [])
        topic = str(input_data.get("topic", ""))
        tone = str(input_data.get("tone", "educational"))
        audience = str(input_data.get("audience", "developers"))
        instagram_format = str(input_data.get("instagram_format", "carousel"))
        target_audience_taxonomy = input_data.get("target_audience_taxonomy")
        editorial_tone_taxonomy = input_data.get("editorial_tone_taxonomy")

        logger.info(f"InstagramStrategyAgent: Formulating strategy for topic '{topic}' targeting '{audience}' (Taxonomy: {target_audience_taxonomy}) with tone '{tone}' (Taxonomy: {editorial_tone_taxonomy})")

        # Summarize competing/source info for context
        research_summary = "\n".join([
            f"- [{r.get('title', 'N/A')}]: {str(r.get('text', r.get('snippet', '')))[:200]}..."
            for r in verified_research[:5]
        ])

        taxonomy_info = ""
        if target_audience_taxonomy:
            taxonomy_info += f"\nTarget Audience Taxonomy: {json.dumps(target_audience_taxonomy)}"
        if editorial_tone_taxonomy:
            taxonomy_info += f"\nEditorial Tone Taxonomy: {json.dumps(editorial_tone_taxonomy)}"

        prompt = f"""
        You are a staff-level social media strategist. Design an Instagram strategy blueprint for the topic below.

        Topic: {topic}
        Audience: {audience}
        Tone: {tone}
        Format: {instagram_format}
        {taxonomy_info}

        Top Research Sources for Context:
        {research_summary}

        Instructions:
        1. ANGLE: Find a unique, attention-grabbing angle suitable for Instagram (e.g. contrarian, step-by-step guide, cheat-sheet, secret insight).
        2. HOOK: Create a hook that stops the scroll (under 12 words). Must feel urgent, curiosity-inducing, or deeply relatable.
        3. STORY STRUCTURE: Detail how the content should flow.
           - For Carousels: Step-by-step progression (e.g. Slide 1: Hook, Slide 2: The Problem, Slide 3-5: The Steps/Tips, Slide 6: CTA).
           - For Single Post: Summary of hook, body, and CTA.
        4. CTA: A strong, platform-native Call to Action (e.g. 'Save this for later', 'Share with a developer friend', 'Drop your thoughts in comments').
        5. VISUAL STYLE: Define a high-quality visual style/prompt context (e.g. minimalist dark theme with neon accents, cyberpunk isometric vector, high-contrast typography, clean 3D claymation).
        """

        try:
            response = await genai_client.generate_structured(prompt, output_schema=StrategySchema)
            content = genai_client.extract_pre_post_content(response)
            strategy_data = json.loads(content)
        except Exception as e:
            logger.error(f"InstagramStrategyAgent: Failed to generate structured strategy: {e}")
            return AgentOutput(data={}, status="error", feedback=str(e))

        logger.info(f"InstagramStrategyAgent: Strategy formulated successfully.")

        return AgentOutput(
            data={
                "strategy": strategy_data,
                "confidence_score": 90.0
            },
            prompt=prompt,
            status="success"
        )
