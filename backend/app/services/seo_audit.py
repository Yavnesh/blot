from typing import Dict, Any
from app.agents.improvement.seo_agent import SEOAgent
from loguru import logger

class SEOAuditService:
    def __init__(self):
        self.seo_agent = SEOAgent()

    async def audit_content(self, content: str, topic: str = "Automated Audit") -> Dict[str, Any]:
        """
        Runs a deep SEO audit on provided content using the SEOAgent.
        """
        logger.info(f"SEOAuditService: Auditing content for topic: {topic}")
        
        # Prepare input for the agent
        input_data = {
            "final_draft": content,
            "topic": topic,
            "primary_keyword": topic, # Assume topic is keyword if not provided
            "search_intent": "informational",
            "content_type": "independent-audit"
        }
        
        # Execute agent
        result = await self.seo_agent.run(input_data)
        
        if result.status == "success":
            return {
                "success": True,
                "audit_report": result.data.get("seo_data"),
                "content_preview": content[:500] + "..."
            }
        else:
            return {
                "success": False,
                "error": result.feedback
            }
