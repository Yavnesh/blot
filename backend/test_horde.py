import asyncio
from app.core.clients.horde_client import generate_image_api
from loguru import logger
import os

async def test_image_generation():
    prompt = "A futuristic city with flying cars, cinematic lighting, high detail"
    post_id = 999
    print(f"Testing image generation for prompt: {prompt}")
    
    crm_path, file_path, b64, censored = await generate_image_api(prompt, post_id)
    
    if crm_path:
        print(f"SUCCESS!")
        print(f"CRM Path: {crm_path}")
        print(f"File Path: {file_path}")
        print(f"Censored: {censored}")
        if os.path.exists(file_path):
            print(f"File verified at {file_path}")
        else:
            print(f"ERROR: File NOT found at {file_path}")
    else:
        print("FAILED: No image generated")

if __name__ == "__main__":
    asyncio.run(test_image_generation())
