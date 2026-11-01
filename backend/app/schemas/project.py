from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime

class ProjectMemberBase(BaseModel):
    user_id: int
    role: str = "creator"

class ProjectMemberOut(ProjectMemberBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    brand_overrides: Optional[Dict[str, Any]] = None
    target_audience: Optional[str] = None
    preferred_keywords: Optional[List[str]] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    brand_overrides: Optional[Dict[str, Any]] = None
    target_audience: Optional[str] = None
    preferred_keywords: Optional[List[str]] = None

class ProjectOut(ProjectBase):
    id: int
    org_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
