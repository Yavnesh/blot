from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class LegalAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Legal & Risk Agent",
            rules=[
                "Perform a defamation and sensitive content risk check.",
                "Inject mandatory industry-specific disclaimers (Medical/Financial).",
                "Flag any potential compliance issues or brand-safety risks."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        content = input_data.get("original_content")
        category = input_data.get("category", "General")
        
        if not content:
            return AgentOutput(data={}, status="error", feedback="No content for legal review")

        logger.info("LegalAgent: Performing risk assessment")
        
        prompt = f"""
        Conduct a legal and risk review of the following article.
        Category: {category}
        
        Content:
        {content}
        
        Instructions:
        1. Check for any potentially defamatory statements.
        2. Check for medical, financial, or legal advice that requires a disclaimer.
        3. If required, append a professional disclaimer to the end of the article.
        4. Flag any 'Red Line' compliance issues (if any).
        5. Provide the final, compliant version of the article.
        """
        
        # In a real system, we might have strict logic/lists for disclaimers.
        response = genai_client.generate_response_single(prompt)
        compliant_content = genai_client.extract_pre_post_content(response)
        
        return AgentOutput(
            data={"final_publish_ready_content": compliant_content},
            prompt=prompt,
            status="success"
        )
