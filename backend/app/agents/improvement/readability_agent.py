from typing import Dict, Any, List, Optional
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client
import textstat

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

    async def _execute(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        content = input_data.get("final_draft")
        
        if not content:
            return AgentOutput(data={}, status="error", feedback="No content to improve")

        logger.info("ReadabilityAgent: Tightening sentences and analyzing readability")
        
        prompt = f"""
        Review the following article for clarity and readability.
        
        Content:
        {content}
        
        Instructions:
        - Simplify complex sentences to improve readability scores.
        - Remove repetitive phrases and "fluff".
        - Ensure smooth transitions between sections.
        - Tighten the prose for maximum impact.
        - Optimize text to be easier to read (higher Flesch Reading Ease score).
        """
        
        # Calculate Deterministic Readability BEFORE
        score_before = textstat.flesch_reading_ease(content)
        
        response = await genai_client.generate_response(prompt)
        clear_content = genai_client.extract_pre_post_content(response)
        
        # Calculate Deterministic Readability AFTER
        score_after = textstat.flesch_reading_ease(clear_content)
        
        return AgentOutput(
            data={
                "clear_content": clear_content,
                "readability_score_before": score_before,
                "readability_score_after": score_after,
                "readability_improvement": score_after - score_before,
                "confidence_score": 90.0
            },
            prompt=prompt,
            status="success"
        )
