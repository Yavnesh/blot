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

        verified_research = []
        domain_cache = {} # Track domains in this batch
        
        try:
            for res in research_data:
                domain = urlparse(res['url']).netloc
                if not domain: continue
                
                if domain in domain_cache:
                    trust_source = domain_cache[domain]
                else:
                    trust_source = db.query(TrustSource).filter(TrustSource.domain == domain).first()
                
                authority_score = 50.0 
                if trust_source:
                    authority_score = trust_source.authority_score
                    domain_cache[domain] = trust_source
                else:
                    # Simulate Moz DA check for new domains
                    authority_score = 20.0 + (hash(domain) % 60)
                    new_trust = TrustSource(domain=domain, authority_score=authority_score, category="Auto-Discovery")
                    db.add(new_trust)
                    domain_cache[domain] = new_trust
                
                if authority_score >= 30:
                    res['authority'] = authority_score
                    verified_research.append(res)
            
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"CredibilityAgent DB error: {e}")
            # If DB fails, we still try to proceed with default authority (memory only)
            pass

        # Check if we successfully verified any research
        if len(verified_research) < 3:
            return AgentOutput(
                data={},
                status="error",
                feedback=f"Found only {len(verified_research)} verified sources (minimum 3 required for high-quality journalism)."
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
