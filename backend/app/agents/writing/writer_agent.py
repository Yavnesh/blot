from typing import Dict, Any, List, Optional
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class WriterAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Platform-Specific Content Writer",
            rules=[
                "Use a Router Pattern to optimize instructions per platform.",
                "Enforce platform-specific formatting (e.g., [1/n] threads for X).",
                "Maintain semantic integrity: Use Unicode bolding for social, Markdown for blogs.",
                "Ensure logical flow and platform-specific hook techniques."
            ]
        )

    async def _execute(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        topic = str(input_data.get("topic", ""))
        content_type = str(input_data.get("content_type", "blog")).lower()
        target_audience = str(input_data.get("target_audience", "General"))
        tone = str(input_data.get("tone", "professional"))
        primary_keyword = str(input_data.get("primary_keyword", topic))
        word_count_target = int(input_data.get("word_count_target", 800))
        verified_research = input_data.get("verified_research", [])
        
        logger.info(f"WriterAgent: Routing generation for {content_type} ('{topic}')")

        # 1. Gather Research Substance
        research_context_list = []
        v_research = list(verified_research) if isinstance(verified_research, list) else []
        for i, r in enumerate(v_research):
            if i >= 3: break
            if isinstance(r, dict):
                r_title = str(r.get('title', 'N/A'))
                r_text = str(r.get('text', ''))
                research_context_list.append(f"Source: {r_title}\n{r_text[:1000]}")
        research_text = "\n\n".join(research_context_list)

        # 2. Platform Router
        if content_type in ["blog", "article"]:
            prompt = self._get_blog_prompt(topic, primary_keyword, research_text, word_count_target, tone, target_audience)
        else:
            prompt = self._get_social_prompt(topic, content_type, primary_keyword, research_text, tone, target_audience)

        response = await genai_client.generate_response(prompt)
        content = genai_client.extract_pre_post_content(response)

        generated_wc = len(content.split())
        logger.info(f"WriterAgent: Generated {generated_wc} words for {content_type}")

        return AgentOutput(
            data={
                "draft_content": content,
                "word_count": generated_wc,
                "platform": content_type,
                "confidence_score": 95.0
            },
            status="success"
        )

    def _get_blog_prompt(self, topic: str, keyword: str, research: str, target_wc: int, tone: str, audience: str) -> str:
        return f"""
        You are a Senior Content Marketer. Write a high-authority {tone} blog post for a {audience} audience.
        
        TOPIC: {topic}
        PRIMARY KEYWORD: {keyword}
        TARGET WORD COUNT: {target_wc}
        RESEARCH DATA: {research}
        
        70:         INSTRUCTIONS:
        71:         1. STRUCTURE: Use H1 for title, H2/H3 for sections. 
        72:         2. INTRO: Start with a strong 'Hook' that addresses a pain point.
        73:         3. SUBSTANCE: Use the provided Research Data to support claims. 
        74:         4. WORD COUNT REALISM: Aim for {target_wc} words. If you find the topic warrants more depth, prioritize quality over length. 
        75:         5. FORMATTING: Use structured Markdown.
        76:         6. NO PREAMBLE: Do NOT include any introductory or concluding conversational filler (e.g., "Certainly!", "Here is your post"). Start directly with the content.
        """

    def _get_social_prompt(self, topic: str, platform: str, keyword: str, research: str, tone: str, audience: str) -> str:
        platform_rules = ""
        
        if platform == "twitter" or platform == "x":
            platform_rules = """
            - FORMAT: Create an X Thread.
            - THREADING: Use [1/n] at the end of every tweet. 
            - NO MARKDOWN: X does not support **bold** or # headers. Use ALL CAPS or Unicode Bold for emphasis.
            - LIMITS: Keep each tweet under 280 characters.
            """
        elif platform == "linkedin":
            platform_rules = """
            - STRUCTURE: Start with a high-impact 'Stop the Scroll' hook (max 2 lines).
            - NO MARKDOWN: LinkedIn does not support bolding. Use Unicode bold fonts for key headings within the post.
            - FORMAT: Use plenty of white space between paragraphs. Include a clear 'Call to Action' at the end.
            """
        elif platform == "instagram":
            platform_rules = """
            - FORMAT: Engaging caption style.
            - VISUALS: Use 3-5 relevant emojis to break up text.
            - TAGS: Place 3-5 PascalCase hashtags at the very bottom.
            """
        else:
            platform_rules = "- FORMAT: Optimized for Engagement and accessibility."

        return f"""
        You are a Social Media Strategist. Write a viral post for {platform.upper()} about {topic}.
        
        TONE: {tone}
        AUDIENCE: {audience}
        RESEARCH SEED: {research}
        
        PLATFORM RULES:
        {platform_rules}
        
        ADDITIONAL INSTRUCTIONS:
        1. Be punchy and direct. 
        2. Avoid generic AI introductory fluff.
        3. Do NOT use markdown bolding (**) for social platforms.
        
        Generate the post now:
        """

