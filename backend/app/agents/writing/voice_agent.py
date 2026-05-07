from typing import Dict, Any, List, Optional
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client
from app.db.session import SessionLocal
from app.models.correction import CorrectionLog
from sqlalchemy import desc

class VoiceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Voice Personalization Agent",
            rules=[
                "Apply the Blot brand tone (Authoritative, Insightful, and Human-centric).",
                "Enforce negative constraints to eliminate 'AI-isms'.",
                "Inject sentence variability (burstiness) for a more human rhythm.",
                "Mandate active voice and remove passive constructions.",
                "Preserve the exact document structure and SEO headings."
            ]
        )

    def _get_past_corrections(self, org_id: int, limit: int = 3) -> str:
        """
        Retrieves recent human edits to provide few-shot style alignment to the LLM.
        This closes the 'Data Flywheel' loop.
        """
        if not org_id:
            return ""
            
        try:
            db = SessionLocal()
            corrections = db.query(CorrectionLog).filter(
                CorrectionLog.org_id == org_id
            ).order_by(desc(CorrectionLog.created_at)).limit(limit).all()
            db.close()
            
            if not corrections:
                return ""
            
            context_blocks = []
            for i, c in enumerate(corrections):
                context_blocks.append(
                    f"Example {i+1}:\n"
                    f"[Original AI Output]:\n{c.original_ai_draft[:500]}...\n"
                    f"[Human Correction]:\n{c.human_edited_draft[:500]}...\n"
                )
            
            return "\n".join(context_blocks)
        except Exception as e:
            logger.error(f"Flywheel error fetching corrections: {e}")
            return ""

    async def _execute(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        draft_content = input_data.get("draft_content")
        brand_rules = input_data.get("brand_rules", "Authoritative, Insightful, and Human-centric.")
        org_id = input_data.get("org_id")
        
        if not draft_content:
            return AgentOutput(data={}, status="error", feedback="No draft content to personalize")

        logger.info(f"VoiceAgent: Hardening brand tone for Org {org_id}")

        # Fetch Personalization context
        personalization = input_data.get("personalization", {})
        if personalization.get("enabled", True):
            cp = personalization.get("company_profile", {})
            brand_rules = f"""
            Voice: {cp.get('brand_voice')}
            Tone: {cp.get('brand_tone')}
            Industry Context: {cp.get('industry')}
            Target Audience: {cp.get('target_audience')}
            Key Messages to Reflect: {cp.get('key_messages')}
            """
        
        # Data Flywheel: Fetch few-shot learning context
        learning_context = self._get_past_corrections(org_id)
        flywheel_instruction = ""
        if learning_context:
            flywheel_instruction = (
                "\nSTRICT STYLE ALIGNMENT (DATA FLYWHEEL):\n"
                "The following examples show how humans have corrected your previous drafts for this specific brand. "
                "Study the differences and apply the same editorial logic to the new draft:\n"
                f"{learning_context}\n"
            )

        prompt = f"""
        You are an elite editorial director. Your task is to polish the following article draft to perfectly match our brand voice.
        
        BRAND VOICE GOALS:
        {brand_rules}
        {flywheel_instruction}
        
        POLISHING RULES:
        1. BANNED WORDS/IDEAS: Do NOT use these cliché AI-isms: 'tapestry', 'delve', 'pivotal', 'landscape', 'unveiling', 'comprehensive guide', 'paving the way', or 'in conclusion'. 
        2. SENTENCE BURSTINESS: Variate sentence lengths. Mix short, punchy sentences (5-10 words) for impact with longer, complex ones for detail. Never use the same structure for three sentences in a row.
        3. ACTIVE VOICE: Rewrite all passive voice constructions (e.g., 'The result was seen by...') into active, direct voice ('Researchers saw the result...').
        4. HUMAN CENTRICITY: Inject insight, empathy, or a clear perspective where appropriate. Avoid sounding like a neutral encyclopedia. 
        5. NO STRUCTURAL CHANGES: You MUST keep the exact same H1, H2, and H3 headings. Do not re-order sections. Focus ONLY on the prose quality and tone.
        6. NO FILLER: Start paragraphs with direct statements. Avoid starting with 'Moreover', 'Additionally', or 'Furthermore'.
        7. NO CONVERSATIONAL PREAMBLE: Do NOT include any introductory or concluding conversational filler like 'Here is the refined draft', 'I have updated the article', or 'Aligned with your brand voice'. Start immediately with the H1 title and the article content.
        
        ARTICLE DRAFT TO REFINE:
        {draft_content}
        
        Refine the prose now:
        """
        
        response = await genai_client.generate_response(prompt)
        personalized_content = genai_client.extract_pre_post_content(response)
        
        return AgentOutput(
            data={
                "final_draft": personalized_content,
                "confidence_score": 98.0
            },
            prompt=prompt,
            status="success"
        )


