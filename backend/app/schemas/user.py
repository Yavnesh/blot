from typing import Optional, List
from pydantic import BaseModel, EmailStr

# Token schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str = ""
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None
    type: Optional[str] = "access"

# User schemas
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    full_name: Optional[str] = None
    role_position: Optional[str] = None
    writing_preference: Optional[str] = None
    audience_familiarity: Optional[str] = None
    onboarding_completed: Optional[bool] = False

class UserCreate(UserBase):
    email: EmailStr
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    is_superuser: bool = False
    organizations: List["Organization"] = []

# Organization schemas
class OrganizationBase(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    brand_voice: Optional[str] = None
    brand_tone: Optional[str] = None
    target_audience: Optional[str] = None
    products_services: Optional[str] = None
    usp: Optional[str] = None
    content_goals: Optional[str] = None
    preferred_keywords: Optional[str] = None
    geography: Optional[str] = None
    key_messages: Optional[str] = None
    competitors: Optional[str] = None
    personalization_enabled: Optional[bool] = True
    blog_sources: Optional[List[dict]] = None
    instagram_sources: Optional[List[dict]] = None

class OrganizationCreate(OrganizationBase):
    name: str
    slug: str

class Organization(OrganizationBase):
    id: int

    class Config:
        from_attributes = True

User.model_rebuild() # Necessary because of the forward reference to Organization
