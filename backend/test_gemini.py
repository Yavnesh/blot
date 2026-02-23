from app.core.clients import genai_client

try:
    print("Testing Gemini...")
    res = genai_client.generate_response_single("Hello, say 'Operational'")
    print(f"Result: {genai_client.extract_pre_post_content(res)}")
except Exception as e:
    print(f"Error: {e}")
