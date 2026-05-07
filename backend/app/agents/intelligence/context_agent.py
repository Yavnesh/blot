from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from loguru import logger
import httpx
import newspaper
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

class CompanyProfileSchema(BaseModel):
    company_name: str
    industry: str
    description: str
    target_audience: str
    geography: str
    usp: str
    products_services: str
    brand_voice: str
    brand_tone: str
    key_messages: str
    keywords: str

class ContextExtractorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Company Context Extraction Agent",
            rules=[
                "Extract structured company information from the provided website content.",
                "Identify brand voice, tone, and key messaging patterns.",
                "List core products/services and the unique selling proposition (USP).",
                "Do NOT hallucinate data. If information is missing, mark as 'Not explicitly stated'.",
                "Maintain professional and accurate representation of the business."
            ]
        )

    async def _scrape_website(self, url: str) -> str:
        """Scrapes the homepage of the provided website URL."""
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return f"Error: Received status code {resp.status_code}"
                
                config = newspaper.Config()
                config.browser_user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                
                article = newspaper.Article(url=url, config=config)
                article.set_html(resp.text)
                article.parse()
                
                return article.text if article.text else "No visible text content found."
        except Exception as e:
            logger.error(f"Failed to scrape website {url}: {e}")
            return f"Error: {str(e)}"

    async def _execute(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        website_url = input_data.get("website_url")
        if not website_url:
            return AgentOutput(data={}, status="error", feedback="Missing website_url in input.")

        logger.info(f"ContextExtractorAgent: Analyzing website {website_url}")
        
        # Step 1: Scrape the website
        content = await self._scrape_website(website_url)
        if content.startswith("Error:"):
            return AgentOutput(data={}, status="error", feedback=content)

        # Step 2: Use Gemini to extract structured profile
        prompt = f"""
        You are a senior brand strategist and business analyst. 
        Analyze the following content from the website {website_url} and extract a structured company profile.
        
        Website Content:
        {content[:8000]}  # Limit content to stay within context window
        
        CRITICAL INSTRUCTIONS:
        1. COMPANY NAME: Extract the official brand name.
        2. INDUSTRY: Identify the primary industry (e.g., Fintech, Real Estate, Legal Tech).
        3. DESCRIPTION: Provide a clear explanation of what the company does.
        4. TARGET AUDIENCE: Who are their primary customers?
        5. GEOGRAPHY: Identify where they operate (e.g., Australia, Global).
        6. USP: Identify their Unique Selling Proposition and key differentiators.
        7. PRODUCTS/SERVICES: List their core offerings simply.
        8. BRAND VOICE: Infer the voice (e.g., Professional, Empathetic, Bold).
        9. BRAND TONE: Infer the tone (e.g., Conversational, Authoritative).
        10. KEY MESSAGES: Identify 3-5 core value propositions or slogans.
        11. KEYWORDS: List 5-10 primary SEO keywords or themes.
        
        If any information is not explicitly stated in the provided text, mark it as "Not explicitly stated".
        Do NOT hallucinate.
        """

        try:
            response = await genai_client.generate_structured(prompt, output_schema=CompanyProfileSchema)
            import json
            profile_data = json.loads(genai_client.extract_pre_post_content(response))
            
            return AgentOutput(
                data=profile_data,
                status="success",
                feedback="Company context extracted successfully."
            )
        except Exception as e:
            logger.error(f"ContextExtractorAgent failed to generate structured response: {e}")
            return AgentOutput(data={}, status="error", feedback=str(e))
