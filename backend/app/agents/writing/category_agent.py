from typing import Dict, Any, List, Optional
import json
from loguru import logger
from pydantic import BaseModel
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
    "Automotive",
    "General"
]

class CategorySchema(BaseModel):
    primary_category: str
    primary_confidence: float
    secondary_category: Optional[str]
    secondary_confidence: Optional[float]

class CategoryAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Categorization Agent",
            rules=[
                "Analyze the content and categorize it accurately.",
                "Assign a primary category and an optional secondary category from the official list.",
                "Provide a confidence score (0.0 to 100.0) for both selections."
            ]
        )

    async def _execute(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> AgentOutput:
        content = str(input_data.get("final_draft") or input_data.get("draft_content") or "")
        topic = str(input_data.get("topic", "article"))

        if not content:
            return AgentOutput(data={}, status="error", feedback="No content provided to categorize.")

        logger.info(f"CategoryAgent: Categorizing '{topic}'")

        safe_content = str(content or "")
        content_snippet = safe_content[:3000]
        prompt_instruction = f"""
        Analyze the following article and assign it a Primary category, and an optional Secondary category.
        You MUST choose from EXACTLY this list of valid categories:
        {json.dumps(CATEGORIES)}

        Topic / Title: {topic}

        Article excerpt:
        {content_snippet}

        Provide a confidence score (0-100) for each category chosen.
        """

        try:
            response = genai_client.generate_structured(prompt_instruction, output_schema=CategorySchema)
            if isinstance(response, genai_client.MockResponse):
                category_data: Dict[str, Any] = dict(json.loads(response.text))
            else:
                category_data: Dict[str, Any] = dict(json.loads(str(response.text)))
        except Exception as e:
            logger.error(f"CategoryAgent: Failed to parse structured output: {e}")
            category_data: Dict[str, Any] = {
                "primary_category": "General",
                "primary_confidence": 0.0,
                "secondary_category": None,
                "secondary_confidence": 0.0
            }

        primary = str(category_data.get("primary_category", "General"))
        
        # Fallback loop to guard against hallucinated periods/formatting
        matched = False
        for valid_cat in CATEGORIES:
            if valid_cat.lower() in primary.lower():
                primary = valid_cat
                matched = True
                break
                
        if not matched:
            logger.warning(f"CategoryAgent: LLM selected invalid category '{primary}'. Falling back to 'General' for human review.")
            primary = "General"
            
        category_data["primary_category"] = primary

        # Validate secondary category safely
        secondary = category_data.get("secondary_category")
        if secondary:
            sec_matched = False
            for valid_cat in CATEGORIES:
                if valid_cat.lower() in str(secondary).lower():
                    secondary = valid_cat
                    sec_matched = True
                    break
            if not sec_matched:
                secondary = None
                category_data["secondary_confidence"] = 0.0
            category_data["secondary_category"] = secondary

        # Ensure compatibility with downstream agents that rely on the top-level "category" key
        return AgentOutput(
            data={
                "category": primary,
                "categorization_details": category_data,
                "confidence_score": float(category_data.get("primary_confidence", 80.0))
            },
            status="success"
        )
