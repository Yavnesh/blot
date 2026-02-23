from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class OriginalityAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Originality Guard Agent",
            rules=[
                "Detect and minimize common AI writing patterns.",
                "Ensure the content offers a unique perspective not found in top 10 search results.",
                "Rewrite sections that feel derivative or generic."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        content = input_data.get("clear_content")
        
        if not content:
            return AgentOutput(data={}, status="error", feedback="No content to check for originality")

        logger.info("OriginalityAgent: Checking for AI patterns and uniqueness")
        
        prompt = f"""
        Analyze the following article for originality and AI-likeness.
        
        Content:
        {content}
        
        Instructions:
        1. Identify any 'over-polished' or 'generic AI' sounding sections.
        2. Rewrite those sections to sound more human, varied, and insightful.
        3. Ensure the core 'Insight' section is truly a unique perspective.
        4. Provide the final, most human-sounding version of the article.
        """
        
        response = genai_client.generate_response_single(prompt)
        original_content = genai_client.extract_pre_post_content(response)
        
        return AgentOutput(
            data={"original_content": original_content},
            prompt=prompt,
            status="success"
        )
