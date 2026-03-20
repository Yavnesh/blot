import re
from typing import Dict, Any, List, Optional
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
                "Maintain a consistent tone across all sections.",
                "Prevent link redundancy via post-processing, not just prompting."
            ]
        )

    def clean_duplicate_links(self, text: str) -> str:
        """
        Production-grade link deduplication. 
        Google likes citations, but not the same URL 5 times in 500 words.
        """
        seen_urls = set()
        
        def replace_link(match):
            label = match.group(1)
            url = match.group(2)
            if url in seen_urls:
                return label # Return just the text if URL already cited
            seen_urls.add(url)
            return match.group(0)

        # Regex to find [Label](URL)
        return re.sub(r'\[([^\]]+)\]\((https?://[^\)]+)\)', replace_link, text)

    async def run(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        verified_research = input_data.get("verified_research", [])
        serp_blueprint = input_data.get("serp_blueprint")
        if not serp_blueprint and input_data.get("strategy_doc"):
            # Fallback if IntentAgent output is just the string
            logger.warning("DraftAgent: Received legacy strategy_doc string instead of structured blueprint.")
            serp_blueprint = {"heading_skeleton": []} # Basic fallback
            
        topic = str(input_data.get("topic", ""))
        primary_keyword = str(input_data.get("primary_keyword", topic))
        word_count_target = int(input_data.get("word_count_target", 1500))
        target_audience = str(input_data.get("target_audience", "General"))
        tone_guide = str(input_data.get("tone_guide", "Professional and Authoritative"))

        if not verified_research or not serp_blueprint:
            return AgentOutput(data={}, status="error", feedback="Missing research or strategy blueprint")

        logger.info(f"DraftAgent: Beginning Section-by-Section drafting for '{topic}'")

        # 1. Prepare Research Context (Limited per section to avoid context squeeze)
        research_context_list = []
        v_research = list(verified_research) if isinstance(verified_research, list) else []
        for i, r in enumerate(v_research):
            if i >= 5: break
            if isinstance(r, dict):
                title_val = str(r.get('title', 'N/A'))
                url_val = str(r.get('url', 'N/A'))
                txt_val = str(r.get('text', ''))
                txt_snippet = txt_val[:2000]
                research_context_list.append(f"Source: {title_val}\nURL: {url_val}\nContent: {txt_snippet}")
        research_context = "\n\n".join(research_context_list)

        # 2. Extract Headings from Blueprint
        headings: List[Dict[str, Any]] = []
        if isinstance(serp_blueprint, dict):
            hd = serp_blueprint.get("heading_skeleton", [])
            headings = list(hd) if isinstance(hd, list) else []
            
        if not headings:
            # Emergency fallback if skeleton is missing
            headings = [{"level": "H2", "text": "Introduction", "intent_and_entities": "Set the stage"}]

        final_article_sections = []
        
        # 3. Step-by-Step Draft to prevent memory fade
        for i, heading in enumerate(headings):
            h_level = heading.get("level", "H2")
            h_text = heading.get("text", "Untitled Section")
            h_intent = heading.get("intent_and_entities", "")
            
            logger.info(f"DraftAgent: Drafting section {i+1}/{len(headings)}: {h_text}")
            
            section_prompt = f"""
            Write the {h_level} section titled "{h_text}" for an article about {topic}.
            
            SECTION GOAL:
            {h_intent}
            
            CONTEXT & DATA:
            - Primary Keyword: {primary_keyword}
            - Target Audience: {target_audience}
            - Tone: {tone_guide}
            - Research Data: 
            {research_context}
            
            WRITING RULES:
            1. Length: Aim for 250-400 words for this specific section.
            2. Citations: Use inline markdown links [Source Name](URL) for any facts or stats.
            3. News Safety: Focus on recent updates ONLY if they are present in the provided Research Data. Do NOT hallucinate dates or day-by-day logs if the research doesn't provide them.
            4. Integration: Naturally integrate the primary keyword and any entities mentioned in the section goal.
            5. Formatting: Use bullet points or short sub-lists if it helps clarity.
            6. NO INTRODUCTORY FILLER: Start writing the content immediately. Do NOT include any sentences like 'Sure, here is the section' or 'I have drafted the content'. 
            
            Output ONLY the section content (including the {h_level} header).
            """
            
            section_response = genai_client.generate_response_single(section_prompt)
            section_text = genai_client.extract_pre_post_content(section_response)
            final_article_sections.append(section_text)

        # 4. Assemble and Post-Process
        full_draft = "\n\n".join(final_article_sections)
        
        # Deduplicate links so the same source isn't linked 10 times
        full_draft = self.clean_duplicate_links(full_draft)
        
        word_count = len(full_draft.split())
        logger.info(f"DraftAgent: Completed drafting. Total words: {word_count}")

        # 5. Final Formatting Pass (Meta Tags & Slug coordination)
        final_output = f"""Article: {topic}
Word Count: {word_count}

{full_draft}
"""

        return AgentOutput(
            data={
                "draft_content": full_draft,
                "word_count": word_count,
                "serp_blueprint": serp_blueprint,
                "confidence_score": 85.0
            },
            status="success"
        )
