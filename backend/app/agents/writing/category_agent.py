import json
from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client

CATEGORIES = [
    "Technology", 
    "Business and Finance", 
    "Health and Fitness", 
    "Travel", 
    "Education", 
    "Entertainment", 
    "Gaming",
    "Food",
    "Fashion",
    "Science",
    "News",
    "Sports",
    "Automotive"
]

class CategoryAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Categorization Agent",
            rules=[
                "Analyze the content and categorize it into exactly ONE of the provided categories.",
                "You must only output the category name string, nothing else."
            ]
        )

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        content = input_data.get("final_draft") or input_data.get("draft_content") or ""
        topic = input_data.get("topic", "article")

        if not content:
            return AgentOutput(data={}, status="error", feedback="No content provided to categorize.")

        logger.info(f"CategoryAgent: Categorizing {topic}")

        prompt_instruction = f"""
        Analyze the following article and assign it to EXACTLY ONE of these categories:
        {json.dumps(CATEGORIES)}

        Article excerpt:
        {content[:3000]}

        Only return the Exact Category Name from the list above. Do not include quotes or extra text.
        """

        llm_response = genai_client.generate_response_single(prompt_instruction)
        category = genai_client.extract_pre_post_content(llm_response).strip()

        # Fallback loop
        matched = False
        for valid_cat in CATEGORIES:
            if valid_cat.lower() in category.lower():
                category = valid_cat
                matched = True
                break
        
        if not matched:
            category = "News" # Safe fallback

        return AgentOutput(
            data={"category": category},
            status="success"
        )
