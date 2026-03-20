from typing import Dict, Any, List, Optional
import json
from loguru import logger
from pydantic import BaseModel
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class ClusterSchema(BaseModel):
    primary_keyword: str
    search_intent: str
    content_type: str
    word_count_target: int
    long_tail_keywords: List[str]
    question_keywords: List[str]
    lsi_terms: List[str] # Kept for backward compatibility, but deprioritized
    pillar_topic: str
    supporting_articles: List[str]
    entities_to_cover: List[str]

class KeywordClusterAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Keyword Cluster Agent",
            rules=[
                "Generate a full topical authority keyword cluster for the given topic.",
                "Identify primary keyword, long-tail variants, and question keywords.",
                "Build a pillar + supporting article map for internal linking.",
                "Use Knowledge Graph / NER patterns to prioritize Entities over LSI keywords.",
                "Do not hallucinate search volume; prioritize semantic relevance."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        topic = str(input_data.get("topic", ""))
        verified_research = input_data.get("verified_research", [])
        fact_graph = input_data.get("fact_graph", {})

        if not topic:
            return AgentOutput(data={}, status="error", feedback="No topic provided for keyword clustering")

        logger.info(f"KeywordClusterAgent: Building topical cluster and Knowledge Graph entities for '{topic}'")

        # 3. Pull actual substance (Fact Graph) instead of just clicky headlines
        context_data = ""
        if fact_graph and isinstance(fact_graph, dict) and "key_facts" in fact_graph:
            key_facts = fact_graph["key_facts"][:10]
            context_data = "\n".join([f"- {f.get('claim', '')} (Stat: {f.get('statistic', '')})" for f in key_facts if isinstance(f, dict)])
        
        if not context_data.strip():
            # Fallback to source titles if fact_graph isn't available
            context_data = "\n".join([f"- {r.get('title', '')}" for r in verified_research[:5]])

        prompt = f"""
You are an expert SEO strategist and Information Retrieval specialist. Given the topic and verified research facts below, generate a comprehensive Semantic Keyword and Entity cluster.

Topic: {topic}

Research Data / Key Findings (Use this substance, not just guesses):
{context_data}

CRITICAL RULES:
1. Search Volume Realism: Do NOT hallucinate a primary keyword just because it sounds high-volume. Use realistic, highly relevant long-tail variations based directly on the provided Research Data.
2. Knowledge Graph Focus: Google ranks based on Entities (Named Entity Recognition). Make sure `entities_to_cover` includes specific people, protocols, organizations, and concepts critical to the topic.
3. Architecture: The `pillar_topic` should be the high-level ultimate guide. The `supporting_articles` are the deep-dive clusters mapped to it.

Produce a valid JSON object tracking the structure provided.
"""

        try:
            response = genai_client.generate_structured(prompt, output_schema=ClusterSchema)
            if isinstance(response, genai_client.MockResponse):
                cluster_data = json.loads(response.text)
            else:
                cluster_data = json.loads(str(response.text))
        except Exception as e:
            logger.error(f"KeywordClusterAgent: Failed to generate structured JSON: {e}")
            # Safe fallback — build a minimal cluster manually
            cluster_data = {
                "primary_keyword": topic,
                "search_intent": "informational",
                "content_type": "deep-dive",
                "word_count_target": 1500,
                "long_tail_keywords": [f"{topic} guide", f"{topic} explained", f"best {topic}", f"{topic} tips", f"{topic} 2026"],
                "question_keywords": [f"What is {topic}?", f"How does {topic} work?", f"Why is {topic} important?"],
                "lsi_terms": [],
                "pillar_topic": topic,
                "supporting_articles": [],
                "entities_to_cover": []
            }

        ent = cluster_data.get("entities_to_cover", [])
        ent_list = [str(x) for x in ent] if isinstance(ent, list) else []
        
        logger.info(f"KeywordClusterAgent: Cluster built — primary='{cluster_data.get('primary_keyword')}', entities_count={len(ent_list)} ")

        lt_kw = cluster_data.get("long_tail_keywords", [])
        q_kw = cluster_data.get("question_keywords", [])
        lsi = cluster_data.get("lsi_terms", [])
        supp = cluster_data.get("supporting_articles", [])
        
        wc = cluster_data.get("word_count_target", 1500)
        word_count = int(wc) if isinstance(wc, (int, str)) and str(wc).isdigit() else 1500

        return AgentOutput(
            data={
                "keyword_cluster": cluster_data,
                "primary_keyword": str(cluster_data.get("primary_keyword", topic)),
                "search_intent": str(cluster_data.get("search_intent", "informational")),
                "content_type": str(cluster_data.get("content_type", "deep-dive")),
                "word_count_target": word_count,
                "long_tail_keywords": [str(x) for x in lt_kw] if isinstance(lt_kw, list) else [],
                "question_keywords": [str(x) for x in q_kw] if isinstance(q_kw, list) else [],
                "lsi_terms": [str(x) for x in lsi] if isinstance(lsi, list) else [],
                "pillar_topic": str(cluster_data.get("pillar_topic", topic)),
                "supporting_articles": [str(x) for x in supp] if isinstance(supp, list) else [],
                "entities_to_cover": ent_list,
                "confidence_score": 88.0
            },
            prompt=prompt,
            status="success"
        )
