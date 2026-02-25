from typing import Dict, Any, List
import json
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client


class SEOAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="On-Page SEO Optimizer Agent",
            rules=[
                "Natural keyword placement — no keyword stuffing.",
                "Generate all on-page signals: title, meta, slug, schema, alt text, internal links.",
                "CTR-optimize titles with emotional triggers, numbers, and curiosity gaps.",
                "Output structured JSON only for machine-readable downstream use."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        final_draft = input_data.get("final_draft") or input_data.get("content_with_seo")
        topic = input_data.get("topic")
        primary_keyword = input_data.get("primary_keyword", topic)
        search_intent = input_data.get("search_intent", "informational")
        content_type = input_data.get("content_type", "deep-dive")
        long_tail_keywords = input_data.get("long_tail_keywords", [])
        lsi_terms = input_data.get("lsi_terms", [])
        word_count_target = input_data.get("word_count_target", 1500)
        serp_blueprint = input_data.get("serp_blueprint", "")

        if not final_draft:
            return AgentOutput(data={}, status="error", feedback="No content for SEO optimization")

        logger.info("SEOAgent: Running full on-page optimization pass")

        # Build keyword context string
        long_tails_str = ", ".join(long_tail_keywords[:5]) if long_tail_keywords else "N/A"
        lsi_str = ", ".join(lsi_terms[:5]) if lsi_terms else "N/A"

        prompt = f"""
You are an expert on-page SEO optimizer. Analyze the article below and produce a complete on-page SEO pack.

Topic: {topic}
Primary Keyword: {primary_keyword}
Search Intent: {search_intent}
Content Type: {content_type}
Long-Tail Keywords: {long_tails_str}
LSI Terms: {lsi_str}

Article (first 3000 chars for analysis):
{final_draft[:3000]}

Return ONLY a valid JSON object with these exact keys. No markdown, no extra text:
{{
  "focus_keyword": "the single most important keyword this article targets",
  "title_variants": [
    "CTR-optimized title with number and year",
    "Benefit-led emotional trigger title",
    "Authority/expert angle title"
  ],
  "meta_description": "Compelling meta description max 155 chars, includes primary keyword naturally",
  "url_slug": "short-hyphenated-keyword-slug",
  "hashtags": ["#Hashtag1", "#Hashtag2", "#Hashtag3", "#Hashtag4", "#Hashtag5"],
  "schema_type": "Article | HowTo | FAQPage | NewsArticle",
  "coverage_score": 85,
  "coverage_missing": ["sub-topic gap 1", "sub-topic gap 2"],
  "internal_link_suggestions": [
    "Suggest linking to a page about [related topic A]",
    "Suggest linking to a page about [related topic B]"
  ],
  "image_alt_text_suggestion": "Descriptive alt text for the featured image",
  "score": 88
}}

Base coverage_score on how well the article covers the expected SERP sub-topics for '{primary_keyword}'.
Base score on overall keyword optimization quality.
"""

        response = genai_client.generate_response_single(prompt)
        raw = genai_client.extract_pre_post_content(response)

        try:
            cleaned = raw.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(cleaned)
        except Exception as e:
            logger.error(f"SEOAgent: Failed to parse JSON: {e}. Raw: {raw[:300]}")
            parsed = {
                "focus_keyword": primary_keyword or topic,
                "title_variants": [topic],
                "meta_description": f"Read our in-depth analysis of {topic}.",
                "url_slug": topic.lower().replace(" ", "-")[:60],
                "hashtags": [f"#{w.capitalize()}" for w in (primary_keyword or topic).split()[:5]],
                "schema_type": "Article",
                "coverage_score": 75,
                "coverage_missing": [],
                "internal_link_suggestions": [],
                "image_alt_text_suggestion": topic,
                "score": 75
            }

        logger.info(f"SEOAgent: On-page pack ready — focus_keyword='{parsed.get('focus_keyword')}', score={parsed.get('score')}, coverage={parsed.get('coverage_score')}")

        return AgentOutput(
            data={
                "seo_data": parsed,             # Full pack stored in DB
                "content_with_seo": final_draft  # Pass-through — draft unchanged
            },
            prompt=prompt,
            status="success"
        )
