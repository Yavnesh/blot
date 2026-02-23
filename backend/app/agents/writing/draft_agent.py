from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class DraftAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Structured Draft Agent",
            rules=[
                "Follow the provided strategy and structure (Hook, Context, Breakdown, Insight, Implications, FAQs, Summary).",
                "Integrate facts and statistics from verified research.",
                "Ensure logical flow and depth in each section."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        verified_research = input_data.get("verified_research")
        strategy_doc = input_data.get("strategy_doc")
        topic = input_data.get("topic")
        
        if not verified_research or not strategy_doc:
            return AgentOutput(data={}, status="error", feedback="Missing research or strategy")

        logger.info(f"DraftAgent: Producing long-form authoritative draft for {topic}")
        
        research_text = "\n\n".join([f"Source: {r['title']}\n{r['text'][:1500]}" for r in verified_research[:5]])

        # Step 1: Generate & Validate Outline
        outline_prompt = f"""
        Generate a detailed outline for a 1500+ word article on '{topic}'.
        Strategy: {strategy_doc}
        Must include:
        - Hook & Context
        - 8+ Subheadings (H2/H3)
        - Data-backed sections
        - FAQ & Summary
        Return ONLY the outline.
        """
        outline = genai_client.generate_response_single(outline_prompt)
        
        # Step 2: Generate Content based on Outline
        draft_prompt = f"""
        Topic: {topic}
        Outline: {outline}
        Research Data:
        {research_text}
        
        Instructions:
        1. Write a deep-dive, high-authority article (1200-2000 words).
        2. EXPLICITLY follow the outline.
        3. Use professional, analytical tone.
        4. Include 2-3 tables or list breakdowns where data is dense.
        5. Ensure each section is expansive (at least 200 words per major section).
        
        Goal: 1200+ Words.
        """
        
        response = genai_client.generate_response_single(draft_prompt)
        draft_content = genai_client.extract_pre_post_content(response)
        
        word_count = len(draft_content.split())
        logger.info(f"DraftAgent: Generated {word_count} words")

        # Step 3: Auto-Expansion if below 1200 words
        if word_count < 1200:
            logger.info("DraftAgent: Content too short. Running expansion layer.")
            expansion_prompt = f"""
            The following article is only {word_count} words. It needs to be 1200+.
            Expand the sections with more technical detail, case studies, and implications.
            
            Current Content:
            {draft_content}
            """
            draft_content = genai_client.generate_response_single(expansion_prompt)
            word_count = len(draft_content.split())

        return AgentOutput(
            data={
                "draft_content": draft_content, 
                "word_count": word_count,
                "outline": outline
            },
            status="success"
        )
