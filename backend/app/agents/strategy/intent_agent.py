from typing import Dict, Any, List
import json
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client


class IntentAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="SERP Blueprint Agent",
            rules=[
                "Reverse-engineer what Google already rewards for the target keyword.",
                "Produce a structured SERP blueprint, not generic advice.",
                "Use the keyword cluster to drive heading structure and entity coverage.",
                "Output must include: angle, recommended H2/H3 skeleton, PAA questions, tone."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        verified_research = input_data.get("verified_research", [])
        topic = input_data.get("topic")
        target_audience = input_data.get("target_audience", "General")

        # Pull keyword cluster from upstream KeywordClusterAgent
        keyword_cluster = input_data.get("keyword_cluster", {})
        primary_keyword = input_data.get("primary_keyword", topic)
        search_intent = input_data.get("search_intent", "informational")
        content_type = input_data.get("content_type", "deep-dive")
        long_tail_keywords = input_data.get("long_tail_keywords", [])
        question_keywords = input_data.get("question_keywords", [])
        lsi_terms = input_data.get("lsi_terms", [])
        entities_to_cover = input_data.get("entities_to_cover", [])
        word_count_target = input_data.get("word_count_target", 1500)

        if not verified_research:
            return AgentOutput(data={}, status="error", feedback="No verified research available")

        logger.info(f"IntentAgent: Building SERP Blueprint for '{topic}' targeting {target_audience}")

        # Summarize top source titles + snippets for context
        research_summary = "\n".join([
            f"- [{r['title']}]({r['url']}): {r['text'][:200]}..."
            for r in verified_research[:5]
        ])

        long_tails_str = ", ".join(long_tail_keywords[:5])
        questions_str = "\n".join([f"  - {q}" for q in question_keywords[:5]])
        entities_str = ", ".join(entities_to_cover[:6])
        lsi_str = ", ".join(lsi_terms[:5])

        prompt = f"""
You are a senior SEO content strategist. Produce a SERP Blueprint for the article below.

Topic: {topic}
Primary Keyword: {primary_keyword}
Search Intent: {search_intent}
Content Type: {content_type}
Target Audience: {target_audience}
Target Word Count: {word_count_target}+
Long-Tail Keywords to Integrate: {long_tails_str}
LSI Terms: {lsi_str}
Key Entities to Cover: {entities_str}
PAA (People Also Ask) Questions to Answer:
{questions_str}

Top Competing Articles (for SERP context):
{research_summary}

Produce a structured content blueprint with:

1. CONTENT ANGLE: A compelling, differentiated angle (e.g. "The Hidden Cost of...", "Why Experts Are Ditching X for Y").
   Must be specific to the search intent ({search_intent}) and audience ({target_audience}).

2. TITLE VARIANTS (3 options):
   - Option A: [Curiosity-gap driven with number]
   - Option B: [Benefit-led, emotional trigger]
   - Option C: [Expert/authority angle]

3. META DESCRIPTION (max 160 chars): Click-worthy, includes primary keyword.

4. URL SLUG: Short, hyphenated, keyword-rich.

5. H2/H3 HEADING SKELETON: Minimum 7 headings. Include:
   - An opening framing section
   - Data-backed middle sections
   - At least 1 FAQ section answering the PAA questions
   - A forward-looking conclusion header

6. CONTENT COVERAGE CHECKLIST: 5-7 specific sub-topics the article MUST address to match SERP expectations.

7. CTA (Call to Action): What the reader should do after reading.

8. TONE GUIDE: 2 sentences on how the writer should sound.

Be specific. No generic advice.
"""

        response = genai_client.generate_response_single(prompt)
        blueprint = genai_client.extract_pre_post_content(response)

        logger.info(f"IntentAgent: SERP Blueprint generated ({len(blueprint.split())} words)")

        return AgentOutput(
            data={
                "strategy_doc": blueprint,   # Keep backward compat key for DraftAgent
                "serp_blueprint": blueprint,
                "target_audience": target_audience,
                "strategy_meta": {
                    "angle": "SERP-Optimized",
                    "intent": search_intent,
                    "content_type": content_type,
                    "primary_keyword": primary_keyword,
                    "word_count_target": word_count_target,
                }
            },
            prompt=prompt,
            status="success"
        )
