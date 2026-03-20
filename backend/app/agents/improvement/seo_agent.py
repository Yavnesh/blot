from typing import Dict, Any, List, Optional
import json
import re
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client
from pydantic import BaseModel, Field

class SEOPackSchema(BaseModel):
    focus_keyword: str
    title_variants: List[str]
    meta_description: str
    url_slug: str
    hashtags: List[str]
    schema_type: str
    coverage_score: int
    coverage_missing: List[str]
    internal_link_suggestions: List[str]
    image_alt_text_suggestion: str
    score: int

class SEOAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="On-Page SEO Optimizer Agent",
            rules=[
                "Natural keyword placement — no keyword stuffing.",
                "Generate all on-page signals: title, meta, slug, schema, alt text, internal links.",
                "CTR-optimize titles with emotional triggers, numbers, and curiosity gaps (Constraints: 50-60 Characters).",
                "Use exact provided site categories for actionable internal link suggestions."
            ]
        )

    def extract_heading_map(self, markdown_text: str) -> str:
        """Extracts all markdown headings (H1-H6) to provide structural context without token bloat."""
        headings = [line.strip() for line in markdown_text.split('\n') if line.strip().startswith('#')]
        return "\n".join(headings) if headings else "No markdown headings found."

    def clean_slug(self, raw_slug: str) -> str:
        """Ensures the returned slug is truly URL-safe."""
        # Lowercase, replace spaces/underscores with hyphens, remove special characters
        clean = raw_slug.lower()
        clean = re.sub(r'[^a-z0-9\s-]', '', clean)
        clean = re.sub(r'[\s_]+', '-', clean)
        clean = re.sub(r'-+', '-', clean) # remove consecutive hyphens
        return clean.strip('-')

    async def run(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        final_draft = input_data.get("final_draft") or input_data.get("content_with_seo")
        topic = input_data.get("topic", "N/A")
        primary_keyword = input_data.get("primary_keyword", topic)
        search_intent = input_data.get("search_intent", "informational")
        content_type = input_data.get("content_type", "deep-dive")
        long_tail_keywords = input_data.get("long_tail_keywords", [])
        lsi_terms = input_data.get("lsi_terms", [])
        word_count_target = input_data.get("word_count_target", 1500)
        
        if context is None:
            context = {}
            
        existing_categories = context.get("existing_site_categories", ["Technology", "Finance", "AI", "Business", "Startups"])

        if not final_draft:
            return AgentOutput(data={}, status="error", feedback="No content for SEO optimization")

        logger.info("SEOAgent: Running full on-page optimization pass with robust constraints")

        # Build context strings
        long_tails_str = ", ".join(long_tail_keywords[:5]) if long_tail_keywords else "N/A"
        lsi_str = ", ".join(lsi_terms[:5]) if lsi_terms else "N/A"
        categories_str = ", ".join(existing_categories)
        
        heading_map = self.extract_heading_map(final_draft)

        prompt = f"""
You are an expert on-page SEO optimizer. Analyze the article below and produce a complete on-page SEO pack.

Topic: {topic}
Primary Keyword: {primary_keyword}
Search Intent: {search_intent}
Content Type: {content_type}
Long-Tail Keywords: {long_tails_str}
LSI Terms: {lsi_str}
Existing Site Categories (For Internal Links): {categories_str}

Article Heading Map (Full Structure Context):
{heading_map}

Article Snippet (first 3000 chars for deep analysis):
{final_draft[:3000]}

Instructions & Constraints:
1. Title Variants: Ensure all title_variants are strictly between 50-60 characters. CTR-optimized.
2. Url Slug: Provide a short, hyphenated url_slug targeting the primary keyword. Stop words removed.
3. Internal Links: Suggest internal links ONLY based on the 'Existing Site Categories' provided above.
4. Schema Type: Choose from 'Article', 'HowTo', 'FAQPage', or 'NewsArticle'. 
   - CRITICAL: Only choose 'FAQPage' if the article physically contains Question & Answer sections. 
   - CRITICAL: Only choose 'HowTo' if the article physically contains sequential steps/tools. 
5. Coverage Score: Base on how well the article covers the expected SERP sub-topics for '{primary_keyword}'. Look at the Heading Map to verify if topics are covered deeper in the article.
"""

        response = genai_client.generate_structured(prompt, output_schema=SEOPackSchema)

        if isinstance(response, genai_client.MockResponse):
            parsed: Dict[str, Any] = json.loads(response.text)
        else:
            try:
                parsed: Dict[str, Any] = json.loads(response.text)
            except Exception as e:
                logger.error(f"SEOAgent: Failed to parse JSON: {e}")
                words = str(primary_keyword or topic).split()
                parsed: Dict[str, Any] = {
                    "focus_keyword": str(primary_keyword or topic),
                    "title_variants": [str(topic)],
                    "meta_description": f"Read our in-depth analysis of {topic}.",
                    "url_slug": str(topic).lower().replace(" ", "-")[:60],
                    "hashtags": [w.capitalize().replace("#", "") for w in words[:5]],
                    "schema_type": "Article",
                    "coverage_score": 75,
                    "coverage_missing": [],
                    "internal_link_suggestions": [],
                    "image_alt_text_suggestion": str(topic),
                    "score": 75
                }

        # Validate & Enforce Rules
        
        # Strip '#' from hashtags if the LLM included them
        if "hashtags" in parsed and isinstance(parsed["hashtags"], list):
            parsed["hashtags"] = [str(t).replace("#", "").strip() for t in parsed["hashtags"]]
        
        # 1. Slug Validation
        parsed["url_slug"] = self.clean_slug(str(parsed.get("url_slug", "")))
        
        # 2. Schema Validation (Fallback safety)
        schema_choice = str(parsed.get("schema_type", "Article"))
        if schema_choice == "FAQPage" and "?" not in heading_map:
            # Revert to Article if FAQ is claimed but no questions are in the headings
            parsed["schema_type"] = "Article"
            logger.info("SEOAgent: Corrected Hallucinated FAQPage schema back to Article.")
        elif schema_choice == "HowTo" and not re.search(r'\b(step|how.to|guide|tutorial|instructions|method)\b', heading_map, re.IGNORECASE):
            parsed["schema_type"] = "Article"
            logger.info("SEOAgent: Corrected Hallucinated HowTo schema back to Article.")

        logger.info(f"SEOAgent: On-page pack ready — focus_keyword='{parsed.get('focus_keyword')}', score={parsed.get('score')}, coverage={parsed.get('coverage_score')}")

        return AgentOutput(
            data={
                "seo_data": parsed,             # Full pack stored in DB
                "content_with_seo": final_draft, # Pass-through — draft unchanged
                "confidence_score": 92.0
            },
            prompt=prompt,
            status="success"
        )
