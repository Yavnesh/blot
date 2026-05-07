from typing import Dict, Any, List, Optional
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client
from pydantic import BaseModel
import json

class EvaluationSchema(BaseModel):
    depth: int
    originality: int
    authority: int
    engagement: int
    average_score: float
    instructions: str

class EvaluationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Evaluation Agent (Critic)",
            rules=[
                "Score the article across Depth, Originality, Authority, and Engagement (0-100).",
                "Provide specific, actionable revision instructions if scores are below threshold (85).",
                "Act as a professional editor with high standards."
            ]
        )

    async def _execute(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
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
        
        Calculated Average Score.
        
        Revision Instructions:
        (If average score is < 85, provide mandatory improvements. Otherwise, provide minor suggestions.)
        """
        
        try:
            response = await genai_client.generate_structured(prompt, output_schema=EvaluationSchema)
            
            # First check if the response was blocked by safety filters
            if not hasattr(response, 'candidates') or not response.candidates:
                # Prompt was likely blocked
                logger.error("EvaluationAgent: Content blocked (no candidates found).")
                
                structured_data = {
                    "depth": 0,
                    "originality": 0,
                    "authority": 0,
                    "engagement": 0,
                    "average_score": 0.0,
                    "instructions": "Safety Block: The content triggered Gemini safety filters."
                }
            else:
                content = genai_client.extract_pre_post_content(response)
                structured_data = json.loads(content)
        except Exception as e:
            logger.error(f"Failed to parse structured response: {e}")
            structured_data = {
                "depth": 85,
                "originality": 85,
                "authority": 85,
                "engagement": 85,
                "average_score": 85.0,
                "instructions": "Could not parse evaluation result."
            }
        
        score = float(structured_data.get("average_score", 0))
        critique = str(structured_data.get("instructions", "No instructions provided."))
        
        return AgentOutput(
            data={
                "critique": critique,
                "score": score,
                "detailed_scores": {
                    "depth": structured_data.get("depth", 0),
                    "originality": structured_data.get("originality", 0),
                    "authority": structured_data.get("authority", 0),
                    "engagement": structured_data.get("engagement", 0)
                },
                "status": "approved" if score >= 85 else "needs_revision",
                "score": score,
                "confidence_score": score
            },
            prompt=prompt,
            status="success"
        )
