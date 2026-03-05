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

    async def run(self, input_data: Dict[str, Any], context: Dict[str, Any] = None) -> AgentOutput:
        content = input_data.get("final_draft") or input_data.get("draft_content")
        post_id = input_data.get("post_id", 0)
        topic = input_data.get("topic", "article")
        
        if not content:
            return AgentOutput(data={}, status="error", feedback="No content for image prompt generation")

        logger.info(f"ImageAgent: Generating premium visual assets for {topic}")
        
        # 1. Generate Context-Aware Prompts with SEO Alt Text
        prompt_instruction = f"""
        Based on this content:
        {content[:2000]}
        
        Generate 3 distinct image prompts for a professional blog.
        Style: Cinematic, high-detail, editorial photography, soft lighting.
        Include 'alt_text' for SEO for each prompt.
        Return in format:
        Prompt | Alt Text
        """
        
        llm_response = genai_client.generate_response_single(prompt_instruction)
        llm_text = genai_client.extract_pre_post_content(llm_response)
        lines = llm_text.split("\n")
        images_data = []
        
        # Extract a clean name/slug for image filing
        image_slug = topic.lower().replace(" ", "-").replace("'", "").replace('"', "")[:50]

        # Process top 3 images (limit for speed/API cost)
        for line in lines:
            if "|" in line:
                prompt_text, alt_text = [x.strip() for x in line.split("|")[:2]]
                if prompt_text and alt_text:
                    # Pass the slug for cleaner server-side naming
                    crm_path, file_path, b64, censored = await horde_client.generate_image_api(prompt_text, post_id, slug=image_slug)
                    images_data.append({
                        "prompt": prompt_text,
                        "alt_text": alt_text,
                        "crm_path": crm_path,
                        "file_path": file_path
                    })
        
        return AgentOutput(
            data={
                "all_images": images_data,
                "cover_image": images_data[0] if images_data else {}
            },
            status="success" if images_data else "warning"
        )
