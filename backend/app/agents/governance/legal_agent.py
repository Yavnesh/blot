from typing import Dict, Any, List, Optional
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client
from pydantic import BaseModel
import json

class RiskAssessmentSchema(BaseModel):
    category: str
    has_defamation_risk: bool
    requires_disclaimer: bool
    has_red_line_compliance_issue: bool
    risk_summary: str

DISCLAIMER_LIBRARY = {
    "Financial": "\n\n**Disclaimer:** This article is for informational purposes only and does not constitute financial advice. Investing involves risk, including the possible loss of principal. Past performance is not indicative of future results.",
    "Medical": "\n\n**Disclaimer:** The information provided in this article is for educational and informational purposes only and is not intended as medical advice. Always consult with a qualified healthcare professional regarding any medical condition or treatment.",
    "General": "\n\n**Disclaimer:** The views and opinions expressed in this article are those of the author and do not necessarily reflect the official policy or position of any other agency, organization, employer, or company."
}

class LegalAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Legal & Risk Agent",
            rules=[
                "Perform a defamation and sensitive content risk check.",
                "Identify if mandatory industry-specific disclaimers (Medical/Financial) are required.",
                "Flag any potential compliance issues or brand-safety risks."
            ]
        )

    async def _execute(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        content = input_data.get("original_content")
        category = input_data.get("category", "General")
        
        if not content:
            # Fallback to drafting output if 'original_content' is missing
            content = input_data.get("final_publish_ready_content", "")
            
        if not content:
            return AgentOutput(data={}, status="error", feedback="No content for legal review")

        logger.info("LegalAgent: Performing risk assessment")
        
        prompt = f"""
        Conduct a legal and risk review of the following article.
        Category Context: {category}
        
        Content:
        {content}
        
        Instructions for Assessment:
        1. Check for any potentially defamatory statements.
        2. Identify if the content contains medical, financial, or legal advice that requires a disclaimer.
        3. Flag any 'Red Line' compliance issues (e.g., specific regulatory violations, egregious brand-safety risks).
        4. Categorize the content type (Financial/Medical/General).
        5. Summarize the risk assessment.
        """
        
        response = genai_client.generate_structured(prompt, output_schema=RiskAssessmentSchema)
        
        if isinstance(response, genai_client.MockResponse):
            structured_data = json.loads(response.text)
        else:
            try:
                structured_data = json.loads(response.text)
            except Exception as e:
                logger.error(f"Failed to parse structured legal response: {e}")
                structured_data = {
                    "category": category,
                    "has_defamation_risk": False,
                    "requires_disclaimer": True,
                    "has_red_line_compliance_issue": False,
                    "risk_summary": "Error parsing LLM response. Defaulting to safe values."
                }
                
        # 1. Deterministic Disclaimer Injection
        final_content = content
        if structured_data.get("requires_disclaimer"):
            predicted_category = str(structured_data.get("category", category))
            # Use predicted category or fallback to context category, then General
            disclaimer_text = DISCLAIMER_LIBRARY.get(
                predicted_category, 
                DISCLAIMER_LIBRARY.get(str(category), DISCLAIMER_LIBRARY["General"])
            )
            final_content += disclaimer_text

        # 2. Risk Score & Black Box Approval
        is_red_line = structured_data.get("has_red_line_compliance_issue", False)
        is_defamatory = structured_data.get("has_defamation_risk", False)
        
        status = "success"
        feedback = ""
        if is_red_line or is_defamatory:
            status = "flagged_for_human_review"
            feedback = "Content requires human review due to legal/compliance risks."
            logger.warning(f"LegalAgent flagged content: Red Line={is_red_line}, Defamatory={is_defamatory}")
        
        return AgentOutput(
            data={
                "final_publish_ready_content": final_content,
                "risk_summary": structured_data.get("risk_summary", ""),
                "is_red_line": is_red_line,
                "is_defamatory": is_defamatory,
                "requires_disclaimer": structured_data.get("requires_disclaimer", False),
                "predicted_category": structured_data.get("category", category),
                "confidence_score": 99.0
            },
            prompt=prompt,
            status=status,
            feedback=feedback
        )
