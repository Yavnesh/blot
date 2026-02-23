from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class VoiceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Voice Personalization Agent",
            rules=[
                "Apply the Tews brand tone (Authoritative, Insightful, and Human-centric).",
                "Enforce specific writing rules (e.g. active voice, no jargon without explanation).",
                "Ensure the content feels unique and not 'generic AI'."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        draft_content = input_data.get("draft_content")
        brand_rules = input_data.get("brand_rules", "Formal but accessible, data-driven, authoritative.")
        
        if not draft_content:
            return AgentOutput(data={}, status="error", feedback="No draft content to personalize")

        logger.info("VoiceAgent: Applying brand tone")
        
        prompt = f"""
        Refine the following article draft to align with our brand voice and style.
        
        Brand Voice: {brand_rules}
        
        Article Draft:
        {draft_content}
        
        Instructions:
        - Improve sentence variety.
        - Ensure a consistent tone throughout.
        - Remove any overly robotic or cliché 'AI writing' patterns.
        - Maintain the exact structure (Hook, Context, etc.) but elevate the prose.
        """
        
        response = genai_client.generate_response_single(prompt)
        personalized_content = genai_client.extract_pre_post_content(response)
        
        return AgentOutput(
            data={"final_draft": personalized_content},
            prompt=prompt,
            status="success"
        )
