from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class CommentCreate(BaseModel):
    comment_text: str
    step_name: Optional[str] = None # e.g. "research", "drafting", "seo", "headline"

class CommentOut(BaseModel):
    id: int
    post_id: int
    user_id: int
    step_name: Optional[str] = None
    comment_text: str
    is_resolved: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SubmitReviewRequest(BaseModel):
    notes: Optional[str] = None

class ManagerDecisionRequest(BaseModel):
    action: str # "approve" or "request_changes"
    feedback: Optional[str] = None

class PostReviewDetailsOut(BaseModel):
    post_id: int
    org_id: int
    project_id: Optional[int] = None
    review_status: str
    target_platform: str
    created_by_id: Optional[int] = None
    approved_by_id: Optional[int] = None
    comments: List[CommentOut] = []

    class Config:
        from_attributes = True
