from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client


class DraftAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="SERP-Aligned Draft Agent",
            rules=[
                "Write EXACTLY what the SERP Blueprint instructs — follow the H2/H3 skeleton.",
                "Integrate facts and statistics from verified research with inline markdown backlinks.",
                "Cover all entities and sub-topics specified in the blueprint.",
                "Answer ALL PAA (People Also Ask) questions in a dedicated FAQ section.",
                "Achieve target word count. Expand if needed."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        verified_research = input_data.get("verified_research")
        strategy_doc = input_data.get("strategy_doc")
        serp_blueprint = input_data.get("serp_blueprint", strategy_doc)  # New blueprint preferred
        topic = input_data.get("topic")

        # Keyword cluster data
        primary_keyword = input_data.get("primary_keyword", topic)
        search_intent = input_data.get("search_intent", "informational")
        content_type = input_data.get("content_type", "deep-dive")
        long_tail_keywords = input_data.get("long_tail_keywords", [])
        question_keywords = input_data.get("question_keywords", [])
        lsi_terms = input_data.get("lsi_terms", [])
        entities_to_cover = input_data.get("entities_to_cover", [])
        word_count_target = input_data.get("word_count_target", 1500)

        if not verified_research or not (strategy_doc or serp_blueprint):
            return AgentOutput(data={}, status="error", feedback="Missing research or strategy blueprint")

        logger.info(f"DraftAgent: Producing SERP-aligned draft for '{topic}' (intent={search_intent}, type={content_type})")

        # Include source URL for backlinks
        research_text = "\n\n".join([
            f"Source Title: {r['title']}\nURL: {r['url']}\n{r['text'][:1500]}"
            for r in verified_research[:5]
        ])

        # Prepare keyword context
        long_tails_str = ", ".join(long_tail_keywords[:5]) if long_tail_keywords else ""
        questions_str = "\n".join([f"  Q: {q}" for q in question_keywords[:5]]) if question_keywords else ""
        entities_str = ", ".join(entities_to_cover[:6]) if entities_to_cover else ""
        lsi_str = ", ".join(lsi_terms[:5]) if lsi_terms else ""

        # Step 1: Structural outline from SERP blueprint
        outline_prompt = f"""
Generate a detailed article outline for '{topic}'.

Primary Keyword: {primary_keyword}
Search Intent: {search_intent}
Content Type: {content_type}
Target Word Count: {word_count_target}+

SERP Blueprint (follow this exactly):
{serp_blueprint[:2000]}

Requirements:
- Use the H2/H3 skeleton from the blueprint above.
- Include a dedicated FAQ section answering these questions:
{questions_str}
- Ensure these entities are covered: {entities_str}
- The outline must support {word_count_target}+ words.

Return ONLY the outline.
"""
        outline = genai_client.extract_pre_post_content(
            genai_client.generate_response_single(outline_prompt)
        )

        # Step 2: Write the full article from outline + research
        draft_prompt = f"""
You are a senior journalist and SEO content strategist. Write a complete, authoritative article.

Topic: {topic}
Primary Keyword (use naturally throughout): {primary_keyword}
Long-Tail Keywords to integrate: {long_tails_str}
LSI Terms to sprinkle in: {lsi_str}
Search Intent: {search_intent}
Content Type: {content_type}
Target Word Count: {word_count_target}+

Article Outline (FOLLOW THIS EXACTLY):
{outline}

Verified Research Sources (cite inline as markdown links):
{research_text}

Writing Rules:
1. Write {word_count_target}+ words of deep, high-authority content.
2. EXACTLY follow the outline structure — every H2 and H3 must appear.
3. Embed source URLs as inline markdown backlinks when citing facts: [Source Name](URL)
4. Include 2-3 data tables or comparison lists where appropriate.
5. Answer ALL FAQ questions in the FAQ section thoroughly.
6. Every major section must be at least 200 words.
7. Use the primary keyword '{primary_keyword}' naturally — in H1 equivalent, first paragraph, and at least 2 H2s.
8. DO NOT stuff keywords. Write for humans first.
9. End with a proper conclusion + forward-looking insight.

Write the complete article now:
"""

        response = genai_client.generate_response_single(draft_prompt)
        draft_content = genai_client.extract_pre_post_content(response)

        word_count = len(draft_content.split())
        logger.info(f"DraftAgent: Generated {word_count} words")

        # Step 3: Auto-expansion if still below target
        if word_count < word_count_target:
            logger.info(f"DraftAgent: Content at {word_count} words. Target is {word_count_target}+. Expanding...")
            expansion_prompt = f"""
The following article is only {word_count} words. Expand it to reach {word_count_target}+ words.

Expansion requirements:
- Add more technical depth to thin sections.
- Add 1-2 real-world case study examples.
- Expand the FAQ section with more questions and detailed answers.
- Add data/statistics from the research if not already included.
- Do NOT add filler — only substantive content.

Current Article:
{draft_content}
"""
            expanded = genai_client.extract_pre_post_content(
                genai_client.generate_response_single(expansion_prompt)
            )
            draft_content = expanded
            word_count = len(draft_content.split())
            logger.info(f"DraftAgent: After expansion: {word_count} words")

        return AgentOutput(
            data={
                "draft_content": draft_content,
                "word_count": word_count,
                "outline": outline
            },
            status="success"
        )
