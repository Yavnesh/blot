from loguru import logger
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import re, random, time
from app.core.config import settings
from app.models.task_progress import TaskProgress

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
    apis_list = [k for k in get_all_api_keys() if k not in exclude_keys]
    
    if not apis_list:
        # If all keys exhausted, try all available keys as a last resort
        apis_list = get_all_api_keys()
        if not apis_list:
            raise ValueError("No Gemini API keys configured")
        
    selected_api = random.choice(apis_list)
    genai.configure(api_key=selected_api)
    model = genai.GenerativeModel('gemini-flash-latest')

    safety_setting={
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }
    return model, safety_setting, selected_api

def generate_response_single(prompt):
    exclude_keys = []
    max_retries = 3
    for attempt in range(max_retries):
        try:
            model, safety_setting, current_key = assign_random_api(exclude_keys)
            response = model.generate_content(prompt, safety_settings=safety_setting)
            return response
        except Exception as e:
            if "429" in str(e):
                logger.warning(f"Key rate limited (429). Rotating key... (Attempt {attempt+1})")
                exclude_keys.append(current_key)
                time.sleep(2)
            else:
                logger.error(f"Gemini API error: {e}")
                raise e
    raise Exception("All Gemini API keys exhausted or rate limited.")

def generate_response_chat(prompt, messages):
    exclude_keys = []
    max_retries = 3
    for attempt in range(max_retries):
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
            if "429" in str(e):
                logger.warning(f"Key rate limited (429) in chat. Rotating key... (Attempt {attempt+1})")
                exclude_keys.append(current_key)
                time.sleep(2)
            else:
                logger.error(f"Gemini API chat error: {e}")
                raise e
    raise Exception("All Gemini API keys exhausted or rate limited in chat.")

def extract_pre_post_content(response):
    if not response: return ""
    if hasattr(response, 'candidates') and response.candidates:
        try:
            return response.candidates[0].content.parts[0].text
        except (IndexError, AttributeError) as e:
            logger.error(f"Error accessing parts: {e}")
            return ""
    elif hasattr(response, 'text'):
        return response.text
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
