import json
from typing import Dict, Any, List, Optional
from loguru import logger
from pydantic import BaseModel
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class HashtagResponse(BaseModel):
    linkedin: List[str]
    x_twitter: List[str]
    instagram: List[str]
    primary_trending: List[str]

class HashtagAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Social Hashtag Agent",
            rules=[
                "Generate platform-specific hashtags using PascalCase (e.g., #ArtificialIntelligence) for accessibility.",
                "Prioritize real-world trending tags if provided as research context.",
                "Ensure tag counts match platform best practices (LinkedIn: 3, Instagram: 5, X: 5)."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        content = input_data.get("final_draft") or input_data.get("draft_content") or ""
        topic = input_data.get("topic", "article")
        viral_tags_context = input_data.get("viral_tags", []) # Optional context from Aggregator

        if not content:
            return AgentOutput(data={}, status="error", feedback="No content provided for hashtags.")

        logger.info(f"HashtagAgent: Generating multi-platform hashtags for {topic}")

        # Limit content for speed and focus, but include enough for context
        safe_content = str(content or "")[:3000]
        viral_str = ", ".join(viral_tags_context) if viral_tags_context else "None provided (use general trends)"

        prompt_instruction = f"""
        Analyze the article below and generate optimized hashtags for LinkedIn, X (Twitter), and Instagram.
        
        TOPIC: {topic}
        VIRAL CONTEXT FROM RECENT NEWS: {viral_str}
        
        ARTICLE EXCERPT:
        {safe_content}

        REQUIREMENTS:
        1. PascalCase: Use PascalCase (CamelCase) for all multi-word tags (better for screen readers).
        2. No Symbols: Return ONLY the words without the '#' prefix in the final JSON strings.
        3. Counts: 
           - LinkedIn: 3 niche, high-authority tags.
           - X: 5 fast-moving, trending tags.
           - Instagram: 5 highly searchable tags.
        4. Strategy: Prioritize tags mentioned in the 'VIRAL CONTEXT' if they are relevant.
        """

        try:
            response = genai_client.generate_structured(prompt_instruction, output_schema=HashtagResponse)
            if isinstance(response, genai_client.MockResponse):
                tag_data = json.loads(response.text)
            else:
                tag_data = json.loads(str(response.text))
        except Exception as e:
            logger.error(f"HashtagAgent: Parsing failed. Using fallback tags. Error: {e}")
            tag_data = {
                "linkedin": ["Business", "Innovation", "Technology"],
                "x_twitter": ["BreakingNews", "TechTrends", "Future"],
                "instagram": ["InstaGood", "TechLife", "Innovation"],
                "primary_trending": ["Trending"]
            }

        # Clean-up pass to remove stray hash symbols or spaces
        final_tags: Dict[str, List[str]] = {}
        for platform_key in ["linkedin", "x_twitter", "instagram", "primary_trending"]:
            platform_list = tag_data.get(platform_key, [])
            if isinstance(platform_list, list):
                final_tags[platform_key] = [str(t).strip().replace("#", "") for t in platform_list]
            else:
                final_tags[platform_key] = []

        return AgentOutput(
            data={
                "tags": final_tags.get("primary_trending", []),
                "hashtags": final_tags.get("primary_trending", []),
                "platform_specific": final_tags,
                "confidence_score": 95.0
            },
            status="success"
        )
