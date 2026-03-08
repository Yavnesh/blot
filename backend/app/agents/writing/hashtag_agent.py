from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class HashtagAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Social Hashtag Agent",
            rules=[
                "Generate exactly 3 to 5 trending, highly relevant hashtags for the provided content.",
                "Ensure hashtags are concise and do not include the '#' symbol in the output string (just words separated by commas)."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        content = input_data.get("final_draft") or input_data.get("draft_content") or ""
        topic = input_data.get("topic", "article")

        if not content:
            return AgentOutput(data={}, status="error", feedback="No content provided for hashtags.")

        logger.info(f"HashtagAgent: Generating hashtags for {topic}")

        prompt_instruction = f"""
        Analyze the following article and generate exactly 3 to 5 highly relevant, trending hashtags.
        
        Article excerpt:
        {content[:3000]}

        Return ONLY a comma-separated list of hashtag words (without the '#' symbol). 
        Format Example: ArtificialIntelligence, TechTrends, Innovation
        """

        llm_response = genai_client.generate_response_single(prompt_instruction)
        raw_tags = genai_client.extract_pre_post_content(llm_response).strip()
        
        # Clean up tags
        tags = [tag.strip().replace("#", "") for tag in raw_tags.split(",") if tag.strip()]
        
        # fallback if format weird
        if not tags or len(tags) < 1:
            tags = ["Intelligence", "Trending", "News"]

        # Limit to 5
        tags = tags[:5]

        return AgentOutput(
            data={"tags": tags},
            status="success"
        )
