from typing import Dict, Any, List, Optional
import json
from loguru import logger
from pydantic import BaseModel
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class HeadingNode(BaseModel):
    level: str
    text: str
    intent_and_entities: str

class BlueprintSchema(BaseModel):
    content_angle: str
    unique_value_rule: str
    title_variants: List[str]
    meta_description: str
    url_slug: str
    heading_skeleton: List[HeadingNode]
    content_coverage_checklist: List[str]
    cta: str
    tone_guide: str

class IntentAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="SERP Blueprint Agent",
            rules=[
                "Reverse-engineer what Google already rewards for the target keyword.",
                "Produce a structured SERP blueprint, not generic advice.",
                "Use the keyword cluster to drive heading structure and entity coverage.",
                "Output structured JSON for the heading skeleton to ensure exact Draft adherence."
            ]
        )

    async def _execute(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        verified_research = input_data.get("verified_research", [])
        topic = str(input_data.get("topic", ""))
        target_audience = str(input_data.get("target_audience", "General"))

        # Pull keyword cluster from upstream KeywordClusterAgent
        primary_keyword = str(input_data.get("primary_keyword", topic))
        search_intent = str(input_data.get("search_intent", "informational"))
        content_type = str(input_data.get("content_type", "deep-dive"))
        
        long_tail_keywords: List[str] = [str(x) for x in input_data.get("long_tail_keywords", [])]
        question_keywords: List[str] = [str(x) for x in input_data.get("question_keywords", [])]
        lsi_terms: List[str] = [str(x) for x in input_data.get("lsi_terms", [])]
        entities_to_cover: List[str] = [str(x) for x in input_data.get("entities_to_cover", [])]
        word_count_target = int(input_data.get("word_count_target", 1500))

        if not verified_research:
            return AgentOutput(data={}, status="error", feedback="No verified research available")

        logger.info(f"IntentAgent: Building SERP Blueprint for '{topic}' targeting {target_audience}")

        # Summarize top source titles + snippets for context
        research_summary = "\n".join([
            f"- [{r.get('title', 'N/A')}]({r.get('url', 'N/A')}): {str(r.get('text', ''))[:200]}..."
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

        Instructions & Constraints:
        1. CONTENT ANGLE: A compelling, differentiated angle. Specific to {search_intent} and {target_audience}.
        2. UNIQUE VALUE RULE: Identify one common trope in the competing titles and intentionally avoid it to stand out.
        3. TITLE VARIANTS: 3 options (Curiosity-gap with number, Benefit-led emotional, Expert/authority).
        4. META DESCRIPTION (max 160 chars) & URL SLUG.
        5. HEADING SKELETON: For every 500 words of the target {word_count_target} count, add at least 2 H2 headings. 
           - Instead of grouping PAA questions at the end, sprinkle PAA answers throughout the H2s where they are contextually relevant.
           - Detail the intent and entities to cover under each heading.
        6. CONTENT COVERAGE CHECKLIST: 5-7 specific sub-topics.
        7. CTA & TONE GUIDE.
        """
        
        try:
            response = await genai_client.generate_structured(prompt, output_schema=BlueprintSchema)
            content = genai_client.extract_pre_post_content(response)
            blueprint_data = json.loads(content)
        except Exception as e:
            logger.error(f"IntentAgent: Failed to generate structured blueprint: {e}")
            return AgentOutput(data={}, status="error", feedback=str(e))

        # Format into a strict strategy doc for DraftAgent
        strategy_doc = f"""STRICT DRAFTING INSTRUCTIONS:
You MUST use the following heading skeleton exactly as written. Do not omit any sections.

# CONTENT ANGLE:
{blueprint_data.get('content_angle', '')}

# UNIQUE VALUE (DIFFERENTIATOR):
{blueprint_data.get('unique_value_rule', '')}

# TONE GUIDE:
{blueprint_data.get('tone_guide', '')}

# HEADING SKELETON:
"""
        for heading in blueprint_data.get("heading_skeleton", []):
            strategy_doc += f"[{heading.get('level', 'H2')}]: {heading.get('text', '')}\n"
            strategy_doc += f"   - Intent & Entities: {heading.get('intent_and_entities', '')}\n\n"

        strategy_doc += f"""# CONTENT COVERAGE CHECKLIST:
"""
        for checklist_item in blueprint_data.get("content_coverage_checklist", []):
            strategy_doc += f"- {checklist_item}\n"

        strategy_doc += f"\n# CALL TO ACTION:\n{blueprint_data.get('cta', '')}\n"

        logger.info(f"IntentAgent: SERP Blueprint generated successfully via Structured Schema.")

        return AgentOutput(
            data={
                "strategy_doc": strategy_doc,   # DraftAgent reads this and MUST follow it
                "serp_blueprint": blueprint_data,
                "target_audience": target_audience,
                "strategy_meta": {
                    "angle": blueprint_data.get("content_angle", "SERP-Optimized"),
                    "intent": search_intent,
                    "content_type": content_type,
                    "primary_keyword": primary_keyword,
                    "word_count_target": word_count_target,
                },
                "confidence_score": 92.0
            },
            prompt=prompt,
            status="success"
        )
