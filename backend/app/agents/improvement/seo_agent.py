from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class SEOAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="SEO Optimizer Agent",
            rules=[
                "Natural keyword placement — no keyword stuffing.",
                "Generate compelling meta tags and schema markup suggestions.",
                "Identify internal linking opportunities based on the topic."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        final_draft = input_data.get("final_draft")
        topic = input_data.get("topic")
        
        if not final_draft:
            return AgentOutput(data={}, status="error", feedback="No content for SEO optimization")

        logger.info("SEOAgent: Optimizing content")
        
        prompt = f"""
        Optimize the following article for SEO.
        Topic: {topic}
        
        Article:
        {final_draft}
        
        Tasks:
        1. Suggest 5 high-value keywords to ensure are present.
        2. Generate a compelling Meta Description (max 160 chars).
        3. Suggest 3 internal linking ideas (generic placeholders like [Link to relevant article on X]).
        4. Provide a JSON-LD schema markup suggestion for an Article.
        """
        
        response = genai_client.generate_response_single(prompt)
        seo_optimized_data = genai_client.extract_pre_post_content(response)
        
        return AgentOutput(
            data={
                "seo_optimized_data": seo_optimized_data,
                "meta_description": "Suggested meta description here.", # Extract if possible
                "content_with_seo": final_draft # If we want the agent to actually rewrite, we'd prompt for it
            },
            prompt=prompt,
            status="success"
        )
