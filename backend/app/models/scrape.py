
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from app.db.base_class import Base

class Scrape(Base):
    id = Column(Integer, primary_key=True, index=True)
    trending_id = Column(String, default='none')
    url = Column(JSON, default=[]) # Storing list of URLs
    title = Column(JSON, default=[]) # Storing list of titles
    content = Column(JSON, default=[]) # Storing list of content
    short_content = Column(Text, default='none')
    images = Column(JSON, default=[]) # Storing list of images
    status = Column(String, default="Not Scraped")
    rep_count = Column(String, default='0')
