from google import genai
from google.genai import types
from loguru import logger
import random
import asyncio
import time
from collections import deque
from typing import Dict, Any, List, Optional, Union
from app.core.config import settings

# 1. KEY STATE MANAGEMENT
class APIKeyState:
    def __init__(self, key: str):
        self.key = key
        self.requests = deque()
        self.cooldown_until = 0
        self.is_leaked = False

    def can_use(self, rpm_limit: int = 15) -> bool:
        """Proactive check: Can this key handle a request right now?"""
        if self.is_leaked:
            return False
            
        now = time.time()
        if now < self.cooldown_until:
            return False

        # Clean up old request timestamps (older than 60s)
        while self.requests and now - self.requests[0] > 60:
            self.requests.popleft()

        return len(self.requests) < rpm_limit

    def mark_used(self):
        self.requests.append(time.time())

    def cooldown(self, seconds: int = 60):
        self.cooldown_until = time.time() + seconds

# 2. GLOBAL POOL INITIALIZATION
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

_KEY_STATES = [APIKeyState(k) for k in get_all_api_keys()]
GLOBAL_SEMAPHORE = asyncio.Semaphore(5) # Strict concurrency control

async def get_available_key_state() -> APIKeyState:
    """Intelligent key selection with least-used strategy."""
    while True:
        # Try to find an immediately available key
        available_keys = [s for s in _KEY_STATES if s.can_use()]
        if available_keys:
            # Least used strategy
            selected = min(available_keys, key=lambda s: len(s.requests))
            selected.mark_used()
            return selected
            
        # All keys busy or in cooldown
        logger.debug("All Gemini keys busy/throttled. Waiting for availability...")
        await asyncio.sleep(1)

# 3. CORE GENERATION LOGIC (REFACTORED)
async def _execute_genai_call(
    method_name: str, 
    model_id: str, 
    contents: Any, 
    config: Optional[Any] = None,
    max_retries: int = 5
):
    """
    Unified execution engine with proactive throttling, 
    global concurrency protection, and intelligent retries.
    """
    async with GLOBAL_SEMAPHORE:
        for attempt in range(max_retries):
            key_state = await get_available_key_state()
            client = genai.Client(api_key=key_state.key)
            
            try:
                if method_name == "generate_content":
                    return await client.aio.models.generate_content(
                        model=model_id, contents=contents, config=config
                    )
                elif method_name == "embed_content":
                    return await client.aio.models.embed_content(
                        model=model_id, contents=contents, config=config
                    )
            except Exception as e:
                err_str = str(e).lower()
                
                # 429: Rate Limit - Trigger backoff and rotate
                if "429" in err_str or "rate_limit" in err_str:
                    # Exponential cooldown with jitter
                    wait_sec = min(60, (2 ** attempt) + random.uniform(1, 5))
                    logger.warning(f"Key {key_state.key[:6]}*** hit 429. Cooling down for {wait_sec:.1f}s")
                    key_state.cooldown(int(wait_sec))
                    continue
                
                # 503: Service Unavailable - Temporary cooldown
                elif "503" in err_str or "unavailable" in err_str:
                    logger.warning(f"Gemini 503 Service Unavailable. Cooling down key {key_state.key[:6]}***")
                    key_state.cooldown(30)
                    continue
                
                # Permanent failures: Blacklist the key
                elif any(msg in err_str for msg in ["leaked", "403", "invalid", "permission"]):
                    logger.error(f"Permanent failure for key {key_state.key[:6]}***. Blacklisting.")
                    key_state.is_leaked = True
                    continue
                
                # Other errors (404, etc.) - Raise immediately
                logger.error(f"GenAI Exception: {e}")
                raise e

        raise RuntimeError(f"All Gemini retries exhausted for {model_id} after {max_retries} attempts.")

# 4. PUBLIC API
async def generate_response_async(prompt: str, model_id: str = "gemini-flash-latest"):
    """Async generation with integrated rate limiting."""
    response = await _execute_genai_call("generate_content", model_id, prompt)
    return response

async def generate_structured_async(prompt: str, output_schema: type, model_id: str = "gemini-flash-latest"):
    """Structured generation with JSON schema enforcement."""
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=output_schema,
    )
    response = await _execute_genai_call("generate_content", model_id, prompt, config=config)
    return response

async def generate_embeddings(text: str, model_id: str = "gemini-embedding-001"):
    """Vector embedding generation with strict dimensionality enforcement (768)."""
    config = None
    if model_id == "text-embedding-004":
        config = types.EmbedContentConfig(output_dimensionality=768)
        
    try:
        response = await _execute_genai_call("embed_content", model_id, text, config=config)
        vec = response.embeddings[0].values
        # Force 768 to match DB schema
        return vec[:768] if len(vec) >= 768 else vec + [0.0] * (768 - len(vec))
    except Exception as e:
        logger.warning(f"Embedding failed for {model_id}, falling back to gemini-embedding-001: {e}")
        if model_id != "gemini-embedding-001":
            return await generate_embeddings(text, model_id="gemini-embedding-001")
        return [0.0] * 768

async def describe_image(image_bytes: bytes, mime_type: str):
    """Multimodal vision analysis with rate limiting."""
    contents = [
        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
        "Provide a detailed technical and semantic description of this image for a knowledge base."
    ]
    response = await _execute_genai_call("generate_content", "gemini-flash-latest", contents)
    return response.text

def extract_pre_post_content(response) -> str:
    """Helper to extract text from GenAI response objects."""
    if hasattr(response, 'text'):
        return response.text
    if isinstance(response, str):
        return response
    if isinstance(response, dict) and 'text' in response:
        return response['text']
    return str(response)

# Synchronous Wrappers
async def generate_structured(prompt: str, output_schema: type, model_id: str = "gemini-flash-latest"):
    return await generate_structured_async(prompt, output_schema, model_id)

def generate_structured_sync(prompt: str, output_schema: type):
    return asyncio.run(generate_structured(prompt, output_schema))

async def generate_response(prompt: str, model_id: str = "gemini-flash-latest"):
    return await generate_response_async(prompt, model_id)

def generate_response_single(prompt: str):
    return asyncio.run(generate_response_async(prompt))

def generate_embeddings_sync(text: str):
    return asyncio.run(generate_embeddings(text))
