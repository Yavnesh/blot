from typing import Optional
from pydantic import BaseModel
from datetime import datetime

# Shared properties
class TwitterPostBase(BaseModel):
    post_id: Optional[str] = 'none'
    content: Optional[str] = 'none'
    status: Optional[str] = 'No Tweet'
    rep_count: Optional[str] = '0'

# Properties to receive on creation
class TwitterPostCreate(TwitterPostBase):
    pass

# Properties to receive on update
class TwitterPostUpdate(TwitterPostBase):
    pass

# Properties shared by models stored in DB
class TwitterPostInDBBase(TwitterPostBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return to client
class TwitterPost(TwitterPostInDBBase):
    pass

# Properties stored in DB
class TwitterPostInDB(TwitterPostInDBBase):
    pass
