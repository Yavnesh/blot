from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class EvaluationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Evaluation Agent (Critic)",
            rules=[
                "Score the article across Depth, Originality, Authority, and Engagement (0-100).",
                "Provide specific, actionable revision instructions if scores are below threshold (80).",
                "Act as a professional editor with high standards."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        content = input_data.get("final_publish_ready_content")
        
        if not content:
            return AgentOutput(data={}, status="error", feedback="No content to evaluate")

        logger.info("EvaluationAgent: Critiquing final article")
        
        prompt = f"""
        Evaluate the following article as a professional editor:
        
        Content:
        {content}
        
        Provide scores (0-100) and feedback for:
        1. Depth of Analysis.
        2. Originality of Perspective.
        3. Authoritative Tone.
        4. Reader Engagement.
        
        Calculated Average Score: [Score]
        
        Revision Instructions:
        (If average score is < 85, provide mandatory improvements. Otherwise, provide minor suggestions.)
        """
        
        response = genai_client.generate_response_single(prompt)
        critique = genai_client.extract_pre_post_content(response)
        
        # In a real system, we'd parse the score
        score = 88 # Simulated
        
        return AgentOutput(
            data={
                "critique": critique,
                "score": score,
                "status": "approved" if score >= 85 else "needs_revision"
            },
            prompt=prompt,
            status="success"
        )
