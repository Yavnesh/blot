from typing import Optional
from pydantic import BaseModel

class PipelineTrigger(BaseModel):
    topic_id: Optional[int] = None
    user_topic: Optional[str] = None
    post_id: Optional[int] = None       # Retry from existing post's topic
    limit: int = 1
    include_images: bool = True
    image_provider: Optional[str] = 'google'
    reuse_scrape: bool = False           # If True, skip GNews and reuse existing scraped data
    context_document_ids: Optional[list[int]] = []
    research_mode: str = 'hybrid' # 'vault', 'web', 'hybrid'
