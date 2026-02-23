"""
Migration script to create task_progress table
Run this with: python3 create_task_progress_table.py
"""
import sys
sys.path.append('.')

from app.db.session import engine
from app.db.base import Base
from app.models.task_progress import TaskProgress

def create_tables():
    """Create all tables that don't exist yet"""
    print("Creating task_progress table...")
    Base.metadata.create_all(bind=engine, tables=[TaskProgress.__table__])
    print("✅ task_progress table created successfully!")

if __name__ == "__main__":
    create_tables()
