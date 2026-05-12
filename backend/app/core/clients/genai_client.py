from google import genai
from google.genai import types
from loguru import logger
import random
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings

# Track keys that are known to be bad
leaked_keys = set()

def get_all_api_keys():
    keys = [
        settings.GEMINI_API_KEY_1,
        settings.GEMINI_API_KEY_2,
        settings.GEMINI_API_KEY_3,
        settings.GEMINI_API_KEY_4,
        settings.GEMINI_API_KEY_5,
        settings.GEMINI_API_KEY_6,
    ]
    return [k for k in keys if k and k.strip()]

def get_client(exclude_keys=None):
    """Returns a google-genai client with a randomly selected valid API key."""
    if exclude_keys is None:
        exclude_keys = []
    
    valid_keys = [k for k in get_all_api_keys() if k not in exclude_keys and k not in leaked_keys]
    
    if not valid_keys:
        logger.warning("All Gemini keys were blacklisted. Clearing blacklist to retry.")
        leaked_keys.clear()
        valid_keys = get_all_api_keys()
        
    if not valid_keys:
        raise ValueError("No Gemini API keys configured.")
        
    selected_key = random.choice(valid_keys)
    return genai.Client(api_key=selected_key), selected_key

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True
)
async def _generate_with_retry(client, model_id, prompt, config=None):
    """Internal helper for async generation with tenacity retries."""
    # The modern google-genai SDK uses client.aio for async operations
    return await client.aio.models.generate_content(
        model=model_id,
        contents=prompt,
        config=config
    )

async def generate_response_async(prompt: str, model_id: str = "gemini-flash-latest"):
    """
    Unified async generation using the modern google-genai SDK.
    Handles key rotation and retries automatically.
    """
    exclude_keys = []
    all_keys = get_all_api_keys()
    
    for _ in range(len(all_keys) or 1):
        try:
            client, current_key = get_client(exclude_keys)
            response = await _generate_with_retry(client, model_id, prompt)
            return response
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "rate_limit" in err_str:
                logger.warning(f"Key {current_key[:6]}*** rate limited. Rotating...")
                exclude_keys.append(current_key)
            elif any(msg in err_str for msg in ["leaked", "403", "invalid", "permission"]):
                logger.error(f"Permanent key error for {current_key[:6]}***. Blacklisting.")
                leaked_keys.add(current_key)
                exclude_keys.append(current_key)
            elif "404" in err_str:
                logger.warning(f"Model or resource not found (404). Not blacklisting key.")
                raise e
            elif "503" in err_str or "unavailable" in err_str:
                logger.warning(f"Key {current_key[:6]}*** hit 503 (High Demand). Rotating...")
                exclude_keys.append(current_key)
            else:
                logger.error(f"GenAI Error: {e}")
                raise e
    
    return type('obj', (object,), {'text': 'All API keys exhausted. [MOCK RESPONSE]'})

def generate_response_single(prompt: str):
    """Synchronous wrapper for legacy code compatibility."""
    return asyncio.run(generate_response_async(prompt))

async def generate_structured_async(prompt: str, output_schema: type, model_id: str = "gemini-flash-latest"):
    """
    Structured generation using the modern SDK's response_schema support.
    """
    exclude_keys = []
    all_keys = get_all_api_keys()
    
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=output_schema,
    )

    for _ in range(len(all_keys) or 1):
        try:
            client, current_key = get_client(exclude_keys)
            response = await _generate_with_retry(client, model_id, prompt, config=config)
            return response
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str:
                exclude_keys.append(current_key)
            elif any(msg in err_str for msg in ["leaked", "403", "invalid"]):
                leaked_keys.add(current_key)
                exclude_keys.append(current_key)
            elif "404" in err_str:
                logger.warning(f"Model or resource not found (404) for structured. Not blacklisting.")
                raise e
            elif "503" in err_str:
                exclude_keys.append(current_key)
            else:
                raise e
    
    return type('obj', (object,), {'text': '{"error": "keys_exhausted"}'})

async def generate_embeddings(text: str, model_id: str = "gemini-embedding-001"):
    """
    Generate embeddings for the given text using the modern SDK.
    Explicitly forces 768 dimensions to match the PostgreSQL 'asset_embeddings' schema.
    """
    exclude_keys = []
    all_keys = get_all_api_keys()

    for _ in range(len(all_keys) or 1):
        try:
            client, current_key = get_client(exclude_keys)
            try:
                # We force 768 to align with our DB schema. 
                # Note: text-embedding-004 is newer but often hits 404 on v1beta keys.
                config = None
                if model_id == "text-embedding-004":
                    config = types.EmbedContentConfig(output_dimensionality=768)
                
                response = await client.aio.models.embed_content(
                    model=model_id,
                    contents=text,
                    config=config
                )
                vec = response.embeddings[0].values
                # Strict enforcement: Truncate or Pad to 768 to ensure DB compatibility
                return vec[:768] if len(vec) >= 768 else vec + [0.0] * (768 - len(vec))
            except Exception as inner_e:
                # Suppress warning for 404 on text-embedding-004
                if "404" in str(inner_e) and model_id == "text-embedding-004":
                    logger.debug(f"text-embedding-004 not found, falling back.")
                else:
                    logger.warning(f"Embedding attempt failed for {model_id}: {inner_e}")
                
                if model_id != "gemini-embedding-001":
                    response = await client.aio.models.embed_content(
                        model="gemini-embedding-001",
                        contents=text
                    )
                    vec = response.embeddings[0].values
                    return vec[:768] if len(vec) >= 768 else vec + [0.0] * (768 - len(vec))
                raise inner_e
        except Exception as e:
            logger.error(f"Global Embedding Error: {e}")
            # If we fail, rotate keys or break
            continue
    
    # Absolute fallback (silent failure but allows task to complete)
    return [0.0] * 768

async def describe_image(image_bytes: bytes, mime_type: str):
    """
    Multimodal analysis: Generates a text description of an image.
    """
    exclude_keys = []
    all_keys = get_all_api_keys()

    for _ in range(len(all_keys) or 1):
        try:
            client, current_key = get_client(exclude_keys)
            response = await client.aio.models.generate_content(
                model="gemini-flash-latest",
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    "Provide a detailed technical and semantic description of this image for a knowledge base."
                ]
            )
            return response.text
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str:
                exclude_keys.append(current_key)
            elif any(msg in err_str for msg in ["leaked", "403", "404", "invalid"]):
                leaked_keys.add(current_key)
                exclude_keys.append(current_key)
            else:
                logger.error(f"Vision Error: {e}")
                raise e
    
    return "Image analysis failed."

def extract_pre_post_content(response) -> str:
    """
    Extracts the text content from a Gemini response object, 
    handling both modern SDK objects and legacy mock objects.
    """
    if hasattr(response, 'text'):
        return response.text
    if isinstance(response, str):
        return response
    if isinstance(response, dict) and 'text' in response:
        return response['text']
    return str(response)

async def generate_structured(prompt: str, output_schema: type, model_id: str = "gemini-flash-latest"):
    """
    Async structured generation.
    """
    return await generate_structured_async(prompt, output_schema, model_id)

def generate_structured_sync(prompt: str, output_schema: type):
    """Synchronous wrapper."""
    return asyncio.run(generate_structured(prompt, output_schema))

async def generate_response(prompt: str, model_id: str = "gemini-flash-latest"):
    """Primary async generation method."""
    return await generate_response_async(prompt, model_id)

def generate_embeddings_sync(text: str):
    """Synchronous wrapper for legacy code compatibility."""
    return asyncio.run(generate_embeddings(text))
