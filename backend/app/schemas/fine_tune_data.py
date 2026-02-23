from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class FineTuneDataBase(BaseModel):
    agent_role: str
    prompt: str
    completion: str
    feedback: Optional[str] = None
    score: Optional[float] = None
    format: str = "instruction"
    metadata_json: Dict[str, Any] = {}

class FineTuneDataCreate(FineTuneDataBase):
    pass

class FineTuneData(FineTuneDataBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
