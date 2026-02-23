from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.db.base_class import Base

class FineTuneData(Base):
    id = Column(Integer, primary_key=True, index=True)
    agent_role = Column(String, index=True)
    prompt = Column(Text)
    completion = Column(Text)
    feedback = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    format = Column(String, default="instruction") # instruction, chat, dpo
    metadata_json = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
