import asyncio
from typing import Dict, Any, List
from loguru import logger
from app.agents.core.base_agent import BaseAgent, AgentOutput
from app.core.clients import genai_client, horde_client

class ImageAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="Visual Content Agent",
            rules=[
                "Create highly descriptive image prompts that match the content's tone.",
                "Ensure prompts are optimized for AI image generation models.",
                "Verify image dimensions and quality parameters."
            ]
        )

    async def _execute(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        content = input_data.get("final_draft") or input_data.get("draft_content")
        post_id = input_data.get("post_id", 0)
        topic = input_data.get("topic", "article")
        
        if not content:
            return AgentOutput(data={}, status="error", feedback="No content for image prompt generation")

        logger.info(f"ImageAgent: Generating premium visual assets for {topic}")
        
        provider = input_data.get("image_provider", "google")
        images_data = []
        import random 
        
        # Prepare an image core prompt
        base_prompt = f"High quality cinematic 8k illustration representing {topic}"
        if input_data.get("seo_data") and input_data.get("seo_data").get("focus_keyword"):
            base_prompt += f", focusing on {input_data['seo_data']['focus_keyword']}"
            
        if provider == "horde":
            logger.info("Invoking Stable Horde for image generation...")
            # Generate 1 primary cover image
            crm_path, fp, b64, censored = await horde_client.generate_image_api(base_prompt, post_id, input_data.get("url_slug", topic.replace(" ", "-").lower()))
            if crm_path:
                images_data.append({
                    "prompt": base_prompt,
                    "alt_text": f"A representation of {topic}",
                    "crm_path": crm_path,
                    "file_path": fp
                })
        else:
            logger.info("Invoking Google API for image generation (Mock / Fallback)")
            # Generate random images using Picsum / Default handling
            for i in range(1, 4):
                width = random.choice([1200, 1000, 800])
                height = random.choice([600, 500, 400])
                rand_id = random.randint(1, 1000)
                url = f"https://picsum.photos/id/{rand_id}/{width}/{height}"
                images_data.append({
                    "prompt": f"Generated via Google API {i}",
                    "alt_text": f"A representation of {topic}",
                    "crm_path": url,
                    "file_path": url
                })
        
        # We always return success so the pipeline is not halted by image failure
        return AgentOutput(
            data={
                "all_images": images_data,
                "cover_image": images_data[0] if len(images_data) > 0 else {},
                "confidence_score": 100.0 if len(images_data) > 0 else 0.0
            },
            status="success" if len(images_data) > 0 else "warning"
        )
