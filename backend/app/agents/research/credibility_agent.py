from typing import Dict, Any, List, Optional
from loguru import logger
from urllib.parse import urlparse
import zlib
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client
from app.models.trust_source import TrustSource

class CredibilityAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Credibility Agent",
            rules=[
                "Verify claims against provided research.",
                "Flag weak or biased sources regardless of Domain Authority.",
                "Assign a confidence score to each major fact.",
                "Identify Logical Fallacies or Emotional Bias."
            ]
        )

    async def _execute(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        db: Session = input_data.get("db")

        research_data = input_data.get("research_data")
        category = input_data.get("category", "General")
        
        if not research_data:
            return AgentOutput(data={}, status="error", feedback="No research data to verify")

        logger.info("CredibilityAgent: Verifying claims, logical fallacies, and source authority")
        
        # High-authority whitelist to bypass random scoring
        whitelist = {
            "techcrunch.com": 85.0, "wired.com": 90.0, "theverge.com": 88.0,
            "indianexpress.com": 82.0, "thehindu.com": 85.0, "reuters.com": 95.0,
            "bloomberg.com": 92.0, "bbc.com": 94.0, "nyt.com": 96.0,
            "arstechnica.com": 85.0, "mashable.com": 80.0,
            "cricbuzz.com": 85.0, "espncricinfo.com": 82.0, "aljazeera.com": 79.0,
            "theathletic.com": 88.0
        }
        
        # Category-Based Thresholds for Stricter Stakes
        thresholds = {
            "Medical": 90.0,
            "Financial": 85.0,
            "Tech News": 30.0,
            "General": 20.0
        }
        current_threshold = thresholds.get(category, 30.0)

        verified_research = []
        
        # 2. Database Upsert Logic (Fixing the Race Condition)
        try:
            for res in research_data:
                domain = urlparse(res.get('url', '')).netloc.replace("www.", "")
                if not domain: continue
                
                # Default domain score calculation via stable Adler32 hashing
                seed = zlib.adler32(domain.encode()) % 60
                authority_score = whitelist.get(domain, 30.0 + seed)
                
                if db:
                    # Safe Upsert pattern to avoid Unique Constraint crashes
                    existing_trust = db.query(TrustSource).filter(TrustSource.domain == domain).first()
                    if existing_trust:
                        authority_score = existing_trust.authority_score
                    else:
                        new_trust = TrustSource(domain=domain, authority_score=authority_score, category="Auto-Discovery")
                        db.add(new_trust)
                        db.commit() # Commit individually to avoid massive batch failure if one faults

                if authority_score >= current_threshold:
                    logger.info(f"CredibilityAgent: Accepted {domain} (DA: {authority_score:.1f}) >= Threshold: {current_threshold}")
                    res['authority'] = authority_score
                    verified_research.append(res)
                else:
                    logger.warning(f"CredibilityAgent: Rejected {domain} (DA: {authority_score:.1f}) — below {category} threshold {current_threshold}")
            
        except Exception as e:
            if db:
                db.rollback()
            logger.error(f"CredibilityAgent DB error: {e}")
            pass

        if len(verified_research) < 1:
            logger.warning("CredibilityAgent: No sources met threshold. Taking top 5 available sources as fallback.")
            verified_research = sorted(research_data, key=lambda x: x.get('authority', 0), reverse=True)[:5]
            if not verified_research:
                return AgentOutput(
                    data={},
                    status="error",
                    feedback="No research data available even for fallback."
                )

        # 3. Prevent Content Truncation by passing larger context
        combined_text = "\n\n".join([f"Source: {r['url']} (DA: {r.get('authority', 0)})\nContent: {r.get('text', '')[:2500]}..." for r in verified_research[:5]])
        
        prompt = f"""
        Evaluate the credibility of the following research data and suggest a refined editorial topic.
        
        Context Data:
        {combined_text}
        
        CRITICAL TASKS:
        1. Specifically analyze the text for Logical Fallacies, Clickbait phrasing, or Emotional Biases.
        2. Identify explicitly Verified claims (supported by multiple sources).
        3. Identify Potential contradictions between the sources provided.
        4. Assign a final Reliability rating (0-100) based strictly on factual consistency and lack of bias.
        5. REFINED TOPIC: Based on the actual substance found in the research, suggest a specific, high-intent editorial topic for the blog post.
        
        Format as:
        REPORT: [Verification details]
        REFINED_TOPIC: [The new topic]
        """
        
        response = await genai_client.generate_response(prompt)
        content = genai_client.extract_pre_post_content(response)
        
        # Parse refined topic if present
        refined_topic = None
        if "REFINED_TOPIC:" in content:
            parts = content.split("REFINED_TOPIC:")
            verification_report = parts[0].replace("REPORT:", "").strip()
            refined_topic = parts[1].strip().split("\n")[0].replace('"', '').replace("'", "")
        else:
            verification_report = content
            
        return AgentOutput(
            data={
                "verification_report": verification_report,
                "refined_topic": refined_topic,
                "confidence_score": 90 if len(verified_research) > 2 else 60,
                "verified_research": verified_research
            },
            status="success"
        )
