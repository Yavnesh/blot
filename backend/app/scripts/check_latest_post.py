import sys
import os
sys.path.append(os.getcwd())
from app.db.session import SessionLocal
from app.models.post import Post

def check_latest_post():
    db = SessionLocal()
    try:
        post = db.query(Post).order_by(Post.id.desc()).first()
        if not post:
            print("No posts found.")
            return
        print(f"Latest Post ID: {post.id}")
        print(f"Title: {post.title}")
        print(f"Status: {post.status}")
        print(f"Created At: {post.created_at}")
    finally:
        db.close()

if __name__ == "__main__":
    check_latest_post()
