
import sys
import os

# Add the backend directory to the sys.path
sys.path.append(os.path.join(os.getcwd()))

from app.db.base import Base
from app.db.session import engine
from patch_db import patch_db

def init_db():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")
    
    print("Running patches...")
    patch_db()
    print("Patches applied.")

if __name__ == "__main__":
    init_db()
