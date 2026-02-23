
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.db.base_class import Base

class TwitterPost(Base):
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(String, default='none')
    content = Column(Text, default='none')
    status = Column(String, default='No Tweet')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    rep_count = Column(String, default='0')
