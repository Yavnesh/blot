from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class IntentAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Audience Intent Agent",
            rules=[
                "Analyze research data to identify primary audience pain points.",
                "Select a specific audience segment (e.g., SaaS, Developers, Crypto).",
                "Define the strategic angle and intent (e.g., educational, persuasive)."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        verified_research = input_data.get("verified_research")
        topic = input_data.get("topic")
        target_audience = input_data.get("target_audience", "General") # Can be passed from upstream or inferred
        
        if not verified_research:
            return AgentOutput(data={}, status="error", feedback="No verified research available")

        logger.info(f"IntentAgent: Determining intent for {topic} targeting {target_audience}")
        
        research_summary = "\n".join([r['title'] for r in verified_research[:3]])
        
        prompt = f"""
        Given the following research on '{topic}':
        {research_summary}
        
        Define a content strategy for the following audience: {target_audience}
        
        Include:
        1. Primary Hook Idea.
        2. Audience Pain Points to address.
        3. Strategic Angle (e.g. 'The Hidden Cost of...', 'Why Experts are Switching to...').
        4. Desired Reader Action (CTA).
        5. Tone adjustment instructions (e.g. 'Technical but accessible', 'High-energy and visionary').
        """
        
        response = genai_client.generate_response_single(prompt)
        strategy_doc = genai_client.extract_pre_post_content(response)
        
        return AgentOutput(
            data={
                "strategy_doc": strategy_doc,
                "target_audience": target_audience,
                "strategy_meta": {
                    "angle": "Expert Analysis", # Simplified example
                    "intent": "Informational"
                }
            },
            prompt=prompt,
            status="success"
        )
