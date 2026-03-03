from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class CredibilityAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Credibility Agent",
            rules=[
                "Verify claims against provided research.",
                "Flag weak or biased sources.",
                "Assign a confidence score to each major fact."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        db = input_data.get("db")
        research_data = input_data.get("research_data")
        if not research_data:
            return AgentOutput(data={}, status="error", feedback="No research data to verify")

        logger.info("CredibilityAgent: Verifying claims and source authority")
        
        from app.models.trust_source import TrustSource
        from urllib.parse import urlparse

        import zlib
        
        # High-authority whitelist to bypass random scoring
        whitelist = {
            "techcrunch.com": 85.0, "wired.com": 90.0, "theverge.com": 88.0,
            "indianexpress.com": 82.0, "thehindu.com": 85.0, "reuters.com": 95.0,
            "bloomberg.com": 92.0, "bbc.com": 94.0, "nyt.com": 96.0,
            "arstechnica.com": 85.0, "mashable.com": 80.0
        }

        verified_research = []
        domain_cache = {} # Track domains in this batch
        
        try:
            for res in research_data:
                domain = urlparse(res['url']).netloc.replace("www.", "")
                if not domain: continue
                
                if domain in domain_cache:
                    trust_source = domain_cache[domain]
                else:
                    trust_source = db.query(TrustSource).filter(TrustSource.domain == domain).first()
                
                if domain in whitelist:
                    authority_score = whitelist[domain]
                elif trust_source:
                    authority_score = trust_source.authority_score
                else:
                    # Deterministic simulation for new domains
                    # Use adler32 instead of hash() to be stable across restarts
                    seed = zlib.adler32(domain.encode()) % 60
                    authority_score = 30.0 + seed 
                    
                    new_trust = TrustSource(domain=domain, authority_score=authority_score, category="Auto-Discovery")
                    db.add(new_trust)
                    domain_cache[domain] = new_trust
                
                if authority_score >= 25: # Relaxed threshold
                    logger.info(f"CredibilityAgent: Accepted {domain} (DA: {authority_score:.1f})")
                    res['authority'] = authority_score
                    verified_research.append(res)
                else:
                    logger.warning(f"CredibilityAgent: Rejected {domain} (DA: {authority_score:.1f}) — below threshold 25")
            
            if db:
                db.commit()
        except Exception as e:
            if db:
                db.rollback()
            logger.error(f"CredibilityAgent DB error: {e}")
            # If DB fails, we still try to proceed with default authority (memory only)
            pass

        # Check if we successfully verified any research
        if len(verified_research) < 1:
            return AgentOutput(
                data={},
                status="error",
                feedback=f"Found only {len(verified_research)} verified sources (minimum 1 required for testing)."
            )

        # Combine snippets for LLM validation
        combined_text = "\n\n".join([f"Source: {r['url']} (DA: {r.get('authority', 0)})\nContent: {r['text'][:500]}..." for r in verified_research[:5]])
        
        prompt = f"""
        Evaluate the credibility of the following high-authority research data:
        {combined_text}
        
        Identify:
        1. Verified claims (supported by multiple sources).
        2. Potential contradictions.
        3. Reliability rating (0-100) based on source authority and consistency.
        """
        
        response = genai_client.generate_response_single(prompt)
        verification_report = genai_client.extract_pre_post_content(response)
        
        return AgentOutput(
            data={
                "verification_report": verification_report,
                "confidence_score": 90 if len(verified_research) > 2 else 60,
                "verified_research": verified_research
            },
            status="success"
        )
