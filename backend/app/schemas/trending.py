from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime

# Shared properties
class TrendingBase(BaseModel):
    topic: Optional[str] = 'none'
    related_topics_rising: Optional[List[Any]] = []
    related_topics_top: Optional[List[Any]] = []
    related_query_rising: Optional[List[Any]] = []
    related_query_top: Optional[List[Any]] = []
    source: Optional[str] = 'none'
    status: Optional[str] = 'none'
    rep_count: Optional[str] = '0'

# Properties to receive on creation
class TrendingCreate(TrendingBase):
    pass

# Properties to receive on update
class TrendingUpdate(TrendingBase):
    pass

# Properties shared by models stored in DB
class TrendingInDBBase(TrendingBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return to client
class Trending(TrendingInDBBase):
    pass

# Properties stored in DB
class TrendingInDB(TrendingInDBBase):
    pass
