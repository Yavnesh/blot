from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class WorkspaceAssetBase(BaseModel):
    name: str
    file_type: str # 'pdf', 'markdown', 'txt'

class WorkspaceAssetCreate(WorkspaceAssetBase):
    # Base64 content or direct text for MVP
    content: Optional[str] = None
    org_id: Optional[int] = None

class WorkspaceAssetResponse(WorkspaceAssetBase):
    id: int
    org_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
