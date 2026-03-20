from typing import Dict, Any, List, Optional
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class VoiceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Voice Personalization Agent",
            rules=[
                "Apply the Tews brand tone (Authoritative, Insightful, and Human-centric).",
                "Enforce negative constraints to eliminate 'AI-isms'.",
                "Inject sentence variability (burstiness) for a more human rhythm.",
                "Mandate active voice and remove passive constructions.",
                "Preserve the exact document structure and SEO headings."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        draft_content = input_data.get("draft_content")
        brand_rules = input_data.get("brand_rules", "Authoritative, Insightful, and Human-centric.")
        
        if not draft_content:
            return AgentOutput(data={}, status="error", feedback="No draft content to personalize")

        logger.info("VoiceAgent: Hardening brand tone and removing AI bias.")
        
        prompt = f"""
        You are an elite editorial director. Your task is to polish the following article draft to perfectly match our brand voice.
        
        BRAND VOICE GOALS:
        {brand_rules}
        
        POLISHING RULES:
        1. BANNED WORDS/IDEAS: Do NOT use these cliché AI-isms: 'tapestry', 'delve', 'pivotal', 'landscape', 'unveiling', 'comprehensive guide', 'paving the way', or 'in conclusion'. 
        2. SENTENCE BURSTINESS: Variate sentence lengths. Mix short, punchy sentences (5-10 words) for impact with longer, complex ones for detail. Never use the same structure for three sentences in a row.
        3. ACTIVE VOICE: Rewrite all passive voice constructions (e.g., 'The result was seen by...') into active, direct voice ('Researchers saw the result...').
        4. HUMAN CENTRICITY: Inject insight, empathy, or a clear perspective where appropriate. Avoid sounding like a neutral encyclopedia. 
        5. NO STRUCTURAL CHANGES: You MUST keep the exact same H1, H2, and H3 headings. Do not re-order sections. Focus ONLY on the prose quality and tone.
        6. NO FILLER: Start paragraphs with direct statements. Avoid starting with 'Moreover', 'Additionally', or 'Furthermore'.
        7. NO CONVERSATIONAL PREAMBLE: Do NOT include any introductory or concluding conversational filler like 'Here is the refined draft', 'I have updated the article', or 'Aligned with your brand voice'. Start immediately with the H1 title and the article content.
        
        ARTICLE DRAFT TO REFINE:
        {draft_content}
        
        Refine the prose now:
        """
        
        response = genai_client.generate_response_single(prompt)
        personalized_content = genai_client.extract_pre_post_content(response)
        
        return AgentOutput(
            data={
                "final_draft": personalized_content,
                "confidence_score": 98.0
            },
            prompt=prompt,
            status="success"
        )

