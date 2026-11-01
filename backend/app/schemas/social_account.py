from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class SocialAccountCreate(BaseModel):
    platform: str # linkedin, twitter, facebook, instagram, webflow
    account_id: str
    account_name: str
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    project_id: Optional[int] = None
    metadata_info: Optional[Dict[str, Any]] = None

class SocialAccountOut(BaseModel):
    id: int
    org_id: int
    project_id: Optional[int] = None
    platform: str
    account_id: str
    account_name: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PublishPostRequest(BaseModel):
    social_account_id: int
    scheduled_at: Optional[datetime] = None
