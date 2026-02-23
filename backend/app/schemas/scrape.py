from typing import Optional, List, Any
from pydantic import BaseModel, HttpUrl

# Shared properties
class ScrapeBase(BaseModel):
    trending_id: Optional[str] = 'none'
    url: Optional[List[str]] = []
    title: Optional[List[str]] = []
    content: Optional[List[str]] = []
    short_content: Optional[str] = 'none'
    images: Optional[List[str]] = []
    status: Optional[str] = "Not Scraped"
    rep_count: Optional[str] = '0'

# Properties to receive on creation
class ScrapeCreate(ScrapeBase):
    pass

# Properties to receive on update
class ScrapeUpdate(ScrapeBase):
    pass

# Properties shared by models stored in DB
class ScrapeInDBBase(ScrapeBase):
    id: int

    class Config:
        from_attributes = True

# Properties to return to client
class Scrape(ScrapeInDBBase):
    pass

# Properties stored in DB
class ScrapeInDB(ScrapeInDBBase):
    pass
