import requests
import sys
from app.db.base import Base
from app.db.session import engine

# Create tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Tables created.")

BASE_URL = "http://localhost:8000/api/v1"

def test_scrape():
    print("Testing Scrape API...")
    # Create
    response = requests.post(f"{BASE_URL}/scrapes/", json={"url": ["http://example.com"], "title": ["Example Title"]})
    if response.status_code != 200:
        print(f"Failed to create scrape: {response.text}")
        return False
    scrape_id = response.json()["id"]
    print(f"Created scrape with ID: {scrape_id}")

    # Read
    response = requests.get(f"{BASE_URL}/scrapes/{scrape_id}")
    if response.status_code != 200:
        print(f"Failed to read scrape: {response.text}")
        return False
    print("Read scrape successfully")

    # Update
    response = requests.put(f"{BASE_URL}/scrapes/{scrape_id}", json={"status": "Scraped"})
    if response.status_code != 200:
        print(f"Failed to update scrape: {response.text}")
        return False
    if response.json()["status"] != "Scraped":
        print("Update verification failed")
        return False
    print("Updated scrape successfully")

    # Delete
    response = requests.delete(f"{BASE_URL}/scrapes/{scrape_id}")
    if response.status_code != 200:
        print(f"Failed to delete scrape: {response.text}")
        return False
    print("Deleted scrape successfully")
    return True

def test_twitter_post():
    print("\nTesting TwitterPost API...")
    # Create
    response = requests.post(f"{BASE_URL}/twitter-posts/", json={"content": "Hello World"})
    if response.status_code != 200:
        print(f"Failed to create twitter post: {response.text}")
        return False
    post_id = response.json()["id"]
    print(f"Created twitter post with ID: {post_id}")

    # Read
    response = requests.get(f"{BASE_URL}/twitter-posts/{post_id}")
    if response.status_code != 200:
        print(f"Failed to read twitter post: {response.text}")
        return False
    
    # Delete
    requests.delete(f"{BASE_URL}/twitter-posts/{post_id}")
    print("Verified TwitterPost API")
    return True

def test_trending():
    print("\nTesting Trending API...")
    # Create
    response = requests.post(f"{BASE_URL}/trendings/", json={"topic": "FastAPI"})
    if response.status_code != 200:
        print(f"Failed to create trending: {response.text}")
        return False
    trending_id = response.json()["id"]
    print(f"Created trending with ID: {trending_id}")

    # Read
    response = requests.get(f"{BASE_URL}/trendings/{trending_id}")
    if response.status_code != 200:
        print(f"Failed to read trending: {response.text}")
        return False

    # Delete
    requests.delete(f"{BASE_URL}/trendings/{trending_id}")
    print("Verified Trending API")
    return True

def test_post():
    print("\nTesting Post API...")
    # Create
    response = requests.post(f"{BASE_URL}/posts/", json={"title": ["My First Post"], "content": ["Content goes here"]})
    if response.status_code != 200:
        print(f"Failed to create post: {response.text}")
        return False
    post_id = response.json()["id"]
    print(f"Created post with ID: {post_id}")

    # Read
    response = requests.get(f"{BASE_URL}/posts/{post_id}")
    if response.status_code != 200:
        print(f"Failed to read post: {response.text}")
        return False

    # Delete
    requests.delete(f"{BASE_URL}/posts/{post_id}")
    print("Verified Post API")
    return True

if __name__ == "__main__":
    try:
        if test_scrape() and test_twitter_post() and test_trending() and test_post():
            print("\nAll tests passed!")
        else:
            print("\nSome tests failed.")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("\nCould not connect to the server. Make sure it is running.")
        sys.exit(1)
