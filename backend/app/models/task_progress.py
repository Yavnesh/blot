from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey

from sqlalchemy.sql import func
from app.db.base_class import Base

class TaskProgress(Base):
    __tablename__ = "task_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    task_id = Column(String, index=True, unique=True)
    topic = Column(String)

    status = Column(String, default="pending", index=True) # pending, running, completed, error
    current_step = Column(String)
    steps = Column(JSON, default=[]) # List of step names with status {name: str, status: str}
    logs = Column(JSON, default=[])
    preview_data = Column(JSON, default={}) # Partial data: headline, outline, fact_count
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
