from typing import Dict, Any, List
from loguru import logger
from app.modules.orchestrator.langgraph.state import ArticleState
from app.agents.writing.image_agent import ImageAgent

async def image_node(state: ArticleState) -> Dict[str, Any]:
    """
    Generates visual assets (cover image and gallery) for the article.
    Integrated into the LangGraph workflow.
    """
    if not state.get("include_images", True):
        return {"logs": ["Visual asset generation skipped by user preference."]}
        
    if state.get("pipeline_type") == "instagram":
        if not state.get("include_images", True):
            return {"logs": ["Instagram image generation skipped by user preference."]}
            
        logger.info("LangGraph [Image]: Generating image assets for Instagram slides...")
        import json
        draft_str = state.get("current_draft")
        if not draft_str:
            return {"logs": ["No draft available to generate images for."]}
            
        try:
            draft_data = json.loads(draft_str)
        except Exception as e:
            return {"logs": [f"Failed to parse draft for slide images: {e}"]}
            
        slides = draft_data.get("slides", [])
        if not slides:
            return {"logs": ["No slides found in draft to generate images for."]}
            
        provider = state.get("image_provider", "google")
        job_id = state["job_id"]
        from app.core.clients import horde_client
        import asyncio
        
        logger.info(f"Generating images for {len(slides)} slides using {provider}...")
        
        async def gen_slide_img(idx, slide):
            prompt = slide.get("image_prompt", f"Visual for slide {idx+1}")
            from app.core.config import settings
            
            if provider == "horde" and settings.STABLE_HORDE_API_KEY:
                try:
                    crm_path, fp, b64, censored = await horde_client.generate_image_api(prompt, job_id, f"slide_{idx}_{job_id}")
                    if crm_path:
                        return f"http://localhost:8080/{crm_path}"
                except Exception as ex:
                    logger.error(f"Horde generation failed for slide {idx}: {ex}")
            
            # Use Pollinations.ai for high quality free AI image generation matching the exact prompt context
            try:
                crm_path, fp, b64, censored = await horde_client.generate_image_pollinations(prompt, job_id, f"slide_{idx}_{job_id}")
                if crm_path:
                    return f"http://localhost:8080/{crm_path}"
            except Exception as ex:
                logger.error(f"Pollinations.ai generation failed for slide {idx} in nodes/image.py: {ex}")
            
            # Absolute fallback to Picsum seed
            import re
            headline = slide.get("headline", "")
            words = [re.sub(r'[^a-zA-Z0-9]', '', w.lower()) for w in headline.split()]
            words = [w for w in words if w and w not in ['a', 'an', 'the', 'is', 'are', 'in', 'on', 'at', 'to', 'for', 'with', 'and', 'vs', 'or', 'of']]
            seed_kw = "-".join(words[:3]) if words else str(idx + 1)
            return f"https://picsum.photos/seed/{seed_kw}/800/800"
            
        tasks = [gen_slide_img(i, slide) for i, slide in enumerate(slides)]
        image_urls = await asyncio.gather(*tasks)
        
        for i, url in enumerate(image_urls):
            slides[i]["image_url"] = url
            
        updated_draft_str = json.dumps(draft_data)
        
        cover_image = {
            "crm_path": image_urls[0] if image_urls else "",
            "file_path": image_urls[0] if image_urls else ""
        }
        
        return {
            "current_draft": updated_draft_str,
            "draft_iterations": [updated_draft_str],
            "cover_image": cover_image,
            "all_images": [{"crm_path": url, "file_path": url} for url in image_urls],
            "logs": [
                f"Generated image assets for {len(slides)} Instagram slides using {provider}."
            ]
        }
        
    logger.info(f"LangGraph [Image]: Synthesizing visual matrix for Job {state['job_id']}")
    
    agent = ImageAgent()
    input_data = {
        "final_draft": state.get("current_draft"),
        "topic": state.get("resolved_topic"),
        "image_provider": state.get("image_provider", "google"),
        "seo_data": state.get("seo_pack")
    }
    
    result = await agent.run(input_data)
    
    if result.status == "success":
        images = result.data.get("all_images", [])
        cover = result.data.get("cover_image", {})
        return {
            "all_images": images,
            "cover_image": cover,
            "logs": [f"Visual synthesis complete. {len(images)} assets generated via {state.get('image_provider', 'default')}."]
        }
        
    return {"logs": [f"Visual agent issue: {result.feedback}"]}
