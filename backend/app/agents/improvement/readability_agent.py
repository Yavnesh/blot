from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class ReadabilityAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Clarity & Readability Agent",
            rules=[
                "Eliminate unnecessary adverbs and fluff.",
                "Improve sentence rhythm and flow.",
                "Ensure a high readability score (Flesch-Kincaid equivalent)."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        content = input_data.get("final_draft")
        
        if not content:
            return AgentOutput(data={}, status="error", feedback="No content to improve")

        logger.info("ReadabilityAgent: Tightening sentences")
        
        prompt = f"""
        Review the following article for clarity and readability.
        
        Content:
        {content}
        
        Instructions:
        - Simplify complex sentences.
        - Remove repetitive phrases.
        - Ensure smooth transitions between sections.
        - Tighten the prose for maximum impact.
        """
        
        response = genai_client.generate_response_single(prompt)
        clear_content = genai_client.extract_pre_post_content(response)
        
        return AgentOutput(
            data={"clear_content": clear_content},
            prompt=prompt,
            status="success"
        )
