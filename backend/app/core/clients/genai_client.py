from loguru import logger
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import re, random, time
from app.core.config import settings
from app.models.task_progress import TaskProgress
import os

class MockResponse:
    def __init__(self, text):
        self.text = text
        self.candidates = [None] # Minimal candidate structure for extract_pre_post_content

# Track keys that are known to be bad (leaked, disabled, etc.) permanently for the current process session
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

def assign_random_api(exclude_keys=None):
    if exclude_keys is None:
        exclude_keys = []
    
    # Filter out keys that are either temporarily excluded (rate-limited) or permanently bad (leaked)
    apis_list = [k for k in get_all_api_keys() if k not in exclude_keys and k not in leaked_keys]
    
    if not apis_list:
        # If all keys were reported leaked/failed, clear the set once to allow retry
        # especially useful if keys were updated without process restart
        logger.warning("All Gemini keys were blacklisted. Clearing blacklist to retry.")
        leaked_keys.clear()
        apis_list = get_all_api_keys()
        
    if not apis_list:
        raise ValueError("No Gemini API keys configured (list is empty)")
        
    selected_api = random.choice(apis_list)
    genai.configure(api_key=selected_api)
    model = genai.GenerativeModel('gemini-2.5-flash')

    safety_setting={
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }
    return model, safety_setting, selected_api

def generate_response_single(prompt):
    all_keys = [k for k in get_all_api_keys() if k not in leaked_keys]
    exclude_keys = []
    # Try as many times as we have non-leaked keys
    max_total_attempts = max(len(all_keys), 1)
    
    for attempt in range(max_total_attempts):
        try:
            model, safety_setting, current_key = assign_random_api(exclude_keys)
            response = model.generate_content(prompt, safety_settings=safety_setting)
            return response
        except Exception as e:
            err_str = str(e)
            if "429" in err_str:
                logger.warning(f"Key rate limited (429). Rotating key... (Attempt {attempt+1}/{max_total_attempts})")
                exclude_keys.append(current_key)
                time.sleep(2)
            elif "API key was reported as leaked" in err_str or "403" in err_str or "404" in err_str:
                logger.error(f"API Key reported leaked, invalid, or 404 restricted. Blacklisting key and rotating... Key: {current_key[:6]}***")
                leaked_keys.add(current_key)
                exclude_keys.append(current_key)
                continue # Retry immediately with another key
            else:
                logger.error(f"Gemini API error: {e}")
                raise e
    
    logger.error("All Gemini API keys exhausted (leaked or rate-limited). Returning Mock Response.")
    return MockResponse("This is a MOCK response for testing. The real API keys are unavailable. [MOCK DATA]")

def generate_structured(prompt, output_schema):
    all_keys = [k for k in get_all_api_keys() if k not in leaked_keys]
    exclude_keys = []
    max_total_attempts = max(len(all_keys), 1)
    
    for attempt in range(max_total_attempts):
        try:
            model, safety_setting, current_key = assign_random_api(exclude_keys)
            
            # Use structure for Pydantic schema directly if supported by generation config
            generation_config = genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=output_schema
            )
            
            response = model.generate_content(prompt, safety_settings=safety_setting, generation_config=generation_config)
            
            # Defensive check for safety blocks in structured generation
            try:
                # Accessing .text will throw if blocked
                _ = response.text
            except (ValueError, Exception) as safety_err:
                if "PROHIBITED_CONTENT" in str(safety_err) or not getattr(response, 'candidates', None):
                    logger.warning(f"Structured Generation BLOCKED by safety filters. Key: {current_key[:6]}***")
                    # Fallback to mock data based on schema for structured parsing safety
                    import json
                    mock_data = {k: 0 if t==int else (0.0 if t==float else "BLOCKED_CONTENT") for k, t in output_schema.__annotations__.items()}
                    return MockResponse(json.dumps(mock_data))
                raise safety_err

            return response
        except Exception as e:
            err_str = str(e)
            if "429" in err_str:
                logger.warning(f"Key rate limited (429). Rotating key... (Attempt {attempt+1}/{max_total_attempts})")
                exclude_keys.append(current_key)
                time.sleep(2)
            elif "API key was reported as leaked" in err_str or "403" in err_str or "404" in err_str:
                logger.error(f"API Key reported leaked, invalid, or 404 restricted. Blacklisting key and rotating... Key: {current_key[:6]}***")
                leaked_keys.add(current_key)
                exclude_keys.append(current_key)
                continue
            else:
                logger.error(f"Gemini API structured error: {e}")
                raise e
                
    logger.error("All Gemini API keys exhausted for structured content. Returning Mock Response.")
    # Return mock payload referencing the schema
    import json
    mock_data = {k: 0 if t==int else (0.0 if t==float else "Mock") for k, t in output_schema.__annotations__.items()}
    return MockResponse(json.dumps(mock_data))

def generate_response_chat(prompt, messages):
    all_keys = [k for k in get_all_api_keys() if k not in leaked_keys]
    exclude_keys = []
    max_total_attempts = max(len(all_keys), 1)
    
    for attempt in range(max_total_attempts):
        try:
            model, safety_setting, current_key = assign_random_api(exclude_keys)
            chat_messages = []
            for m in messages:
                chat_messages.append({'role': m['role'], 'parts': [m['parts'][0]]})
            
            chat_messages.append({'role': 'user', 'parts': [prompt]})
            response = model.generate_content(chat_messages, safety_settings=safety_setting)
            
            # Update messages for next turn
            messages.append({'role': 'user', 'parts': [prompt]})
            messages.append({'role': 'model', 'parts': [response.text]})
            return messages, response
        except Exception as e:
            err_str = str(e)
            if "429" in err_str:
                logger.warning(f"Key rate limited (429) in chat. Rotating key... (Attempt {attempt+1}/{max_total_attempts})")
                exclude_keys.append(current_key)
                time.sleep(2)
            elif "API key was reported as leaked" in err_str or "403" in err_str or "404" in err_str:
                logger.error(f"API Key leaked, invalid or 404 restricted in chat. Blacklisting and rotating... Key: {current_key[:6]}***")
                leaked_keys.add(current_key)
                exclude_keys.append(current_key)
                continue
            else:
                logger.error(f"Gemini API chat error: {e}")
                raise e
    
    logger.error("All Gemini keys exhausted in chat. Returning Mock.")
    messages.append({'role': 'user', 'parts': [prompt]})
    messages.append({'role': 'model', 'parts': ["MOCK chat response. [MOCK DATA]"]})
    return messages, MockResponse("MOCK chat response. [MOCK DATA]")

def extract_pre_post_content(response):
    if not response: return ""
    if isinstance(response, MockResponse):
        return response.text
    if hasattr(response, 'candidates') and response.candidates and response.candidates[0]:
        try:
            return response.candidates[0].content.parts[0].text
        except (IndexError, AttributeError) as e:
            logger.error(f"Error accessing parts: {e}")
            return ""
    elif hasattr(response, 'text'):
        try:
            return response.text
        except (ValueError, Exception):
            # Known Gemini block or error
            if hasattr(response, 'prompt_feedback'):
                logger.warning(f"Response extracted as empty due to safety block: {response.prompt_feedback}")
            return "Safety Block: Potential prohibited content detected."
    return ""

def generate_image_prompt(merged_content):
    p = generate_image_prompt_one(merged_content)
    _, r = generate_response_chat(p, [])
    p = generate_image_prompt_two()
    _, r = generate_response_chat(p, [])
    return extract_pre_post_content(r)

def generate_content_info(merged_content):
    p = generate_content_info_one(merged_content)
    return extract_pre_post_content(generate_response_single(p))

def generate_content_cta(merged_content):
    p = generate_content_cta_one(merged_content)
    res = extract_pre_post_content(generate_response_single(p))
    if not res: return []
    qs = res.split("**Question of survey ")[1:]
    return [[o.strip() for o in q.split("\n")[1:] if o.strip()] for q in qs]

def generate_meta_info(rel_t, rel_q, merged):
    p = generate_meta_info_one(merged, rel_t, rel_q)
    return extract_pre_post_content(generate_response_single(p))

def generate_short_content(merged):
    p = generate_short_content_one(merged)
    return extract_pre_post_content(generate_response_single(p))

def generate_trend_topics(merged, kw):
    p = generate_trend_topics_one(merged, kw)
    return extract_pre_post_content(generate_response_single(p))

def generate_content(topic, short, merged, rel_t, rel_q, cat):
    author = select_author(cat[0] if isinstance(cat, list) and cat else "Technology")
    p1 = generate_content_prompt_one(short[0] if isinstance(short, list) else short)
    msgs, r = generate_response_chat(p1, [])
    p2 = generate_content_prompt_two(topic, merged, rel_t, rel_q, cat)
    msgs, r = generate_response_chat(p2, msgs)
    p3 = generate_content_prompt_three()
    msgs, r = generate_response_chat(p3, msgs)
    return extract_pre_post_content(r), author

def generate_twitter_post(merged):
    p = generate_twitter_post_one(merged)
    return extract_pre_post_content(generate_response_single(p))

def select_author(c):
    return {"Technology": "tessa@tewsletter.com", "Finance": "monica@tewsletter.com"}.get(c, "william@tewsletter.com")

def generate_image_prompt_one(m): return f"Content: {m}\nImage ideas..."
def generate_image_prompt_two(): return "Prompts..."
def generate_image_prompt_three(): return "Rank..."
def generate_image_prompt_four(): return "Top 3..."
def generate_content_info_one(m): return f"Info for: {m}"
def generate_content_cta_one(m): return f"Survey for: {m}"
def generate_meta_info_one(m, t, q): return f"Meta for: {m}"
def generate_short_content_one(m): return f"Article for: {m}"
def generate_trend_topics_one(m, k): return f"Trends for: {m}"
def generate_content_prompt_one(s): return f"Outline for: {s}"
def generate_content_prompt_two(t, m, rt, rq, c): return f"1200 words on {t}"
def generate_content_prompt_three(): return "Refine: Proofread, 1000+ words."
def generate_twitter_post_one(m): return f"Tweet for: {m}"
