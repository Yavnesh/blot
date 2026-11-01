import urllib.request
import json
import time

def main():
    # Get all new topics
    req = urllib.request.Request('http://localhost:8080/api/v1/trendings/')
    with urllib.request.urlopen(req) as response:
        topics = json.loads(response.read().decode())
    
    new_topics = [t for t in topics if t.get('status') == 'New']
    print(f"Found {len(new_topics)} new topics. Triggering sequentially...")
    
    for t in new_topics:
        print(f"Triggering pipeline for {t['topic']}...")
        try:
            data = json.dumps({
                "topic_id": t['id'],
                "limit": 1,
                "include_images": False
            }).encode('utf-8')
            req = urllib.request.Request(
                'http://localhost:8080/api/v1/generation/trigger',
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode())
                print("Result:", result)
            time.sleep(2)
        except Exception as e:
            print("Error:", e)

if __name__ == '__main__':
    main()
