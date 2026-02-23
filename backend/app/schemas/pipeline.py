from typing import Optional
from pydantic import BaseModel

class PipelineTrigger(BaseModel):
    topic_id: Optional[int] = None
    user_topic: Optional[str] = None
    limit: int = 1
    include_images: bool = True
