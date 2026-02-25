from typing import Dict, Any, List
import json
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client


class KeywordClusterAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Keyword Cluster Agent",
            rules=[
                "Generate a full topical authority keyword cluster for the given topic.",
                "Identify primary keyword, long-tail variants, and question keywords.",
                "Build a pillar + supporting article map for internal linking.",
                "Return structured JSON only — no prose."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        topic = input_data.get("topic")
        verified_research = input_data.get("verified_research", [])

        if not topic:
            return AgentOutput(data={}, status="error", feedback="No topic provided for keyword clustering")

        logger.info(f"KeywordClusterAgent: Building topical cluster for '{topic}'")

        # Pull top source titles to give the LLM context
        source_titles = "\n".join([f"- {r['title']}" for r in verified_research[:5]])

        prompt = f"""
You are an expert SEO strategist. Given the topic and research below, generate a comprehensive keyword cluster in valid JSON.

Topic: {topic}

Top Source Headlines (for context):
{source_titles}

Return ONLY a valid JSON object with exactly these keys:
{{
  "primary_keyword": "the exact search query a person would type in Google",
  "search_intent": "informational | commercial | transactional | navigational",
  "content_type": "listicle | how-to | comparison | deep-dive | news | opinion",
  "word_count_target": 1500,
  "long_tail_keywords": ["variant 1", "variant 2", "variant 3", "variant 4", "variant 5"],
  "question_keywords": ["What is...?", "How to...?", "Why does...?", "Which...?", "When should...?"],
  "lsi_terms": ["semantically related term 1", "term 2", "term 3", "term 4", "term 5"],
  "pillar_topic": "the broad pillar this article contributes to",
  "supporting_articles": ["supporting article idea 1", "supporting article idea 2", "supporting article idea 3"],
  "entities_to_cover": ["key entity 1", "key entity 2", "key entity 3", "key entity 4"]
}}

Return ONLY the JSON. No markdown, no explanation.
"""

        response = genai_client.generate_response_single(prompt)
        raw = genai_client.extract_pre_post_content(response)

        try:
            # Strip markdown code fences if present
            cleaned = raw.replace("```json", "").replace("```", "").strip()
            cluster_data = json.loads(cleaned)
        except Exception as e:
            logger.error(f"KeywordClusterAgent: Failed to parse JSON: {e}. Raw: {raw[:200]}")
            # Safe fallback — build a minimal cluster manually
            cluster_data = {
                "primary_keyword": topic,
                "search_intent": "informational",
                "content_type": "deep-dive",
                "word_count_target": 1500,
                "long_tail_keywords": [f"{topic} guide", f"{topic} explained", f"best {topic}", f"{topic} tips", f"{topic} 2025"],
                "question_keywords": [f"What is {topic}?", f"How does {topic} work?", f"Why is {topic} important?"],
                "lsi_terms": [],
                "pillar_topic": topic,
                "supporting_articles": [],
                "entities_to_cover": []
            }

        logger.info(f"KeywordClusterAgent: Cluster built — primary='{cluster_data.get('primary_keyword')}', intent='{cluster_data.get('search_intent')}', type='{cluster_data.get('content_type')}'")

        return AgentOutput(
            data={
                "keyword_cluster": cluster_data,
                "primary_keyword": cluster_data.get("primary_keyword", topic),
                "search_intent": cluster_data.get("search_intent", "informational"),
                "content_type": cluster_data.get("content_type", "deep-dive"),
                "word_count_target": cluster_data.get("word_count_target", 1500),
                "long_tail_keywords": cluster_data.get("long_tail_keywords", []),
                "question_keywords": cluster_data.get("question_keywords", []),
                "lsi_terms": cluster_data.get("lsi_terms", []),
                "pillar_topic": cluster_data.get("pillar_topic", topic),
                "supporting_articles": cluster_data.get("supporting_articles", []),
                "entities_to_cover": cluster_data.get("entities_to_cover", [])
            },
            prompt=prompt,
            status="success"
        )
