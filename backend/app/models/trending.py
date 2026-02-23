
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.db.base_class import Base

class Trending(Base):
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, default='none')
    related_topics_rising = Column(JSON, default=[])
    related_topics_top = Column(JSON, default=[])
    related_query_rising = Column(JSON, default=[])
    related_query_top = Column(JSON, default=[])
    source = Column(String, default='none')
    status = Column(String, default='none')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    rep_count = Column(String, default='0')
    
    # New discovery fields
    trend_score = Column(Integer, default=0)
    search_volume = Column(Integer, default=0)
    growth_rate = Column(Integer, default=0)
    social_mentions = Column(Integer, default=0)
    competition_gap = Column(Integer, default=0)
    extra_metadata = Column(JSON, default={})
