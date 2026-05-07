from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.db.base_class import Base

class Post(Base):
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    post_id = Column(String, default='none')
    title = Column(JSON, default=[])
    meta = Column(Text, default='none')
    subtitle = Column(JSON, default=[])
    content = Column(JSON, default=[])
    conclusion = Column(JSON, default=[])
    category = Column(JSON, default=[])
    subcategory = Column(JSON, default=[])
    tags = Column(JSON, default=[])
    author = Column(String, default="Max")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    status = Column(String, default='Pre Draft')
    survey = Column(JSON, default=[])
    image_prompt = Column(JSON, default=[])
    image_data = Column(JSON, default=[])
    image_path = Column(JSON, default=[])
    image_crm = Column(JSON, default=[])
    all_image_data = Column(JSON, default=[])
    rep_count = Column(String, default='0')
    
    # New publishing and SEO fields
    word_count = Column(Integer, default=0)
    seo_data = Column(JSON, default={}) # Contains meta title, desc, slug, keywords
    research_sources = Column(JSON, default=[]) # Snapshot of verified sources
    agent_telemetry = Column(JSON, default=[]) # Detailed logs and scores for UI transparency
    pub_platform = Column(String, default='none') # wordpress, webflow, etc.
    pub_meta = Column(JSON, default={}) # platform specific IDs or status
