from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class WriterAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Platform-Specific Writer Agent",
            rules=[
                "Respect the selected content type and optimize for the specified platform.",
                "Maintain high editorial quality and adhere to requested tone.",
                "Generate complete, ready-to-publish content.",
                "Return output in structured markdown format."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        topic = input_data.get("topic")
        content_type = input_data.get("content_type", "blog").lower()
        target_audience = input_data.get("target_audience", "General")
        tone = input_data.get("tone", "professional")
        keywords = input_data.get("primary_keyword", topic)
        word_count = input_data.get("word_count_target", 1500)
        additional_context = input_data.get("additional_context", "")
        verified_research = input_data.get("verified_research", [])
        
        logger.info(f"WriterAgent: Generating {content_type} content for topic '{topic}'")

        # Include source URL for backlinks if applicable
        research_text = ""
        if verified_research:
            research_text = "\n\n".join([
                f"Source Title: {r['title']}\nURL: {r['url']}\n{r['text'][:1000]}"
                for r in verified_research[:5]
            ])

        system_prompt = f"""
You are WriterAgent, a specialized AI agent in a fully agentic editorial pipeline responsible for generating high-quality written content based on topics triggered from a CMS.
Your role is to transform a given topic, content type, and contextual inputs into well-structured, engaging, and platform-optimized content.

### Input Parameters:
Topic: {topic}
Content_Type: {content_type}
Audience: {target_audience}
Tone: {tone}
Keywords: {keywords}
Word_Count Limit or Target: {word_count}
Additional Context/Blueprint: {additional_context}
Verified Research: {research_text}

### Instructions Based on Content Type:

1. Long-Form Content (blog, article)
If Content_Type is 'blog' or 'article':
- Generate long-form editorial content.
- Include: Compelling Title, Introduction, Well-structured sections, Subheadings, Actionable insights, Examples/explanations, Conclusion, Optional CTA.
- Format strictly as Content_Type: Blog/Article -> Title -> Intro -> Sections -> Conclusion.
- Highly informative, clear logical flow, SEO-friendly (natural keyword integration, H1/H2/H3).
- Target word count: 800 - 2000. Do not overstuff keywords.

2. Short-Form Content (instagram, twitter, linkedin, meta)
If Content_Type represents a social platform:
- Instagram: caption, hook, emojis, hashtags. Length: 100-300 words. Engaging/conversational.
- Twitter: a single tweet OR a tweet thread (Tweet 1 hook, Tweets 2-5 insights, Final tweet CTA). Concise, punchy, under platform limits.
- LinkedIn: professional thought-leadership post (Hook, Story/insight, Key takeaways, Call to action). Length: 150-400 words.
- Meta / Facebook: engaging caption, conversational tone, optional storytelling (Hook, Main message, CTA, optional hashtags). Length: 100-250 words.

### Output Rules
- Always output in structured markdown.
- Do not mix content formats.
- NEVER produce incomplete drafts.
- Ensure 100% original content without generic filler.

Generate the complete ready-to-publish content now.
        """

        response = genai_client.generate_response_single(system_prompt)
        draft_content = genai_client.extract_pre_post_content(response)

        generated_word_count = len(draft_content.split())
        logger.info(f"WriterAgent: Generated {generated_word_count} words")

        # Return draft_content, keeping compatibility with orchestrator key
        return AgentOutput(
            data={
                "draft_content": draft_content,
                "word_count": generated_word_count
            },
            status="success"
        )
