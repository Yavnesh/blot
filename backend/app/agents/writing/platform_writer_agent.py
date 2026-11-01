import json
import logging
from typing import Dict, Any, Optional
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client
from app.agents.writing.platform_schemas import (
    LinkedInPostSchema,
    TwitterThreadSchema,
    MetaAdSchema,
    BlogSeoSchema,
)

logger = logging.getLogger(__name__)

class PlatformWriterAgent(BaseAgent):
    """
    Dedicated generator agent specialized in platform-specific algorithms and reader formats:
    LinkedIn, Twitter/X Threads, Meta Ads, and Blog/SEO.
    """
    def __init__(self):
        super().__init__(
            role="Multi-Platform Content Architect",
            rules=[
                "Adhere to platform algorithms (e.g. dwell time on LinkedIn, character bounds on Twitter).",
                "Inject brand voice and target audience context into tone and phrasing.",
                "Ensure factual grounding by integrating retrieved research and fact graphs.",
                "Always generate validated JSON conforming to the respective platform schema."
            ]
        )

    async def generate_linkedin_post(
        self,
        topic: str,
        research_context: str,
        brand_profile: Dict[str, Any]
    ) -> AgentOutput:
        prompt = f"""
Write a high-performing LinkedIn thought-leadership post about: '{topic}'.

Brand Voice & Audience Guidelines:
- Brand Voice: {brand_profile.get('brand_voice', 'Authoritative and insightful')}
- Target Audience: {brand_profile.get('target_audience', 'Industry Decision Makers')}
- Tone: {brand_profile.get('brand_tone', 'Professional and forward-looking')}

Ground Truth Research Context:
{research_context[:3000]}

Format Requirements:
1. First 2 lines must create a strong curiosity gap or contrarian hook to drive 'see more' clicks.
2. Short, punchy 1-2 sentence paragraphs.
3. 3-5 bulleted key takeaways with concrete substance.
4. Closing question to drive engagement in the comment section.
5. 3-5 relevant hashtags.
"""
        try:
            response = await genai_client.generate_structured(prompt, output_schema=LinkedInPostSchema)
            data = json.loads(genai_client.extract_pre_post_content(response))
            return AgentOutput(data=data, status="success")
        except Exception as e:
            logger.error(f"Failed to generate LinkedIn post: {e}")
            return AgentOutput(data={}, status="error", feedback=str(e))

    async def generate_twitter_thread(
        self,
        topic: str,
        research_context: str,
        brand_profile: Dict[str, Any]
    ) -> AgentOutput:
        prompt = f"""
Write a viral Twitter/X educational thread about: '{topic}'.

Brand Voice: {brand_profile.get('brand_voice', 'Concise and impactful')}
Target Audience: {brand_profile.get('target_audience', 'Tech Professionals')}

Research Context:
{research_context[:3000]}

Format Requirements:
1. Hook Tweet: Must be under 250 characters. Tease value, high stakes, or non-obvious insight.
2. Body Tweets (4-7 tweets): Each individual tweet MUST be strictly under 280 characters.
3. Closing Tweet: Summary plus a call to follow/repost or visit website.
"""
        try:
            response = await genai_client.generate_structured(prompt, output_schema=TwitterThreadSchema)
            data = json.loads(genai_client.extract_pre_post_content(response))
            return AgentOutput(data=data, status="success")
        except Exception as e:
            logger.error(f"Failed to generate Twitter thread: {e}")
            return AgentOutput(data={}, status="error", feedback=str(e))

    async def generate_meta_ad(
        self,
        topic: str,
        research_context: str,
        brand_profile: Dict[str, Any]
    ) -> AgentOutput:
        prompt = f"""
Write high-converting Meta (Facebook & Instagram) ad copy for: '{topic}'.

Brand Context:
- Company: {brand_profile.get('company_name', 'The Brand')}
- USP: {brand_profile.get('usp', 'Premium AI-driven solutions')}
- Target Audience: {brand_profile.get('target_audience', 'Modern Consumers')}

Research Context:
{research_context[:2500]}

Format Requirements:
- Compelling primary text highlighting the user's core problem and transformation.
- Punchy headline under 40 characters.
- Short link description.
- High-intent Call-To-Action button.
- Detailed image asset prompt for visual design generation.
"""
        try:
            response = await genai_client.generate_structured(prompt, output_schema=MetaAdSchema)
            data = json.loads(genai_client.extract_pre_post_content(response))
            return AgentOutput(data=data, status="success")
        except Exception as e:
            logger.error(f"Failed to generate Meta ad: {e}")
            return AgentOutput(data={}, status="error", feedback=str(e))

    async def run(self, input_data: Dict[str, Any]) -> AgentOutput:
        platform = input_data.get("platform", "linkedin").lower()
        topic = input_data.get("topic", "")
        research = input_data.get("research_context", "")
        brand_profile = input_data.get("brand_profile", {})

        if platform == "linkedin":
            return await self.generate_linkedin_post(topic, research, brand_profile)
        elif platform == "twitter":
            return await self.generate_twitter_thread(topic, research, brand_profile)
        elif platform in ("facebook", "instagram", "meta"):
            return await self.generate_meta_ad(topic, research, brand_profile)
        else:
            return await self.generate_linkedin_post(topic, research, brand_profile)
