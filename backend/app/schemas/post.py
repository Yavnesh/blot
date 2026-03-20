from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime

# Shared properties
class PostBase(BaseModel):
    post_id: Optional[str] = 'none'
    title: Optional[List[str]] = []
    meta: Optional[str] = 'none'
    subtitle: Optional[List[str]] = []
    content: Optional[List[str]] = []
    conclusion: Optional[List[str]] = []
    category: Optional[List[str]] = []
    subcategory: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    author: Optional[str] = "Max"
    status: Optional[str] = 'Pre Draft'
    survey: Optional[List[str]] = []
    image_prompt: Optional[List[str]] = []
    image_data: Optional[List[str]] = []
    image_path: Optional[List[str]] = []
    image_crm: Optional[List[str]] = []
    all_image_data: Optional[List[Any]] = []
    rep_count: Optional[str] = '0'
    
    # Newly added fields so the API exposes them
    word_count: Optional[int] = 0
    seo_data: Optional[Any] = {}
    research_sources: Optional[Any] = []
    agent_telemetry: Optional[Any] = []
    pub_platform: Optional[str] = 'none'
    pub_meta: Optional[Any] = {}

# Properties to receive on creation
class PostCreate(PostBase):
    pass

# Properties to receive on update
class PostUpdate(PostBase):
    pass

# Properties shared by models stored in DB
class PostInDBBase(PostBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return to client
class Post(PostInDBBase):
    pass

# Properties stored in DB
class PostInDB(PostInDBBase):
    pass
