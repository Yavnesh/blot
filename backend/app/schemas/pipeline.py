from typing import Optional, List
from pydantic import BaseModel

class TaxonomyInput(BaseModel):
    category_id: int
    primary_subcategory_id: int
    secondary_subcategory_ids: List[int]

class PipelineTrigger(BaseModel):
    topic_id: Optional[int] = None
    user_topic: Optional[str] = None
    post_id: Optional[int] = None       # Retry from existing post's topic
    limit: int = 1
    include_images: bool = True
    image_provider: Optional[str] = 'google'
    reuse_scrape: bool = False           # If True, skip GNews and reuse existing scraped data
    context_document_ids: Optional[List[int]] = []
    research_mode: str = 'hybrid' # 'vault', 'web', 'hybrid'
    pipeline_type: str = 'blog' # 'blog' or 'instagram'
    instagram_format: Optional[str] = 'carousel' # 'carousel' or 'single'
    tone: Optional[str] = 'educational'
    audience: Optional[str] = 'developers'
    word_count_target: Optional[int] = 1500
    target_audience_taxonomy: Optional[TaxonomyInput] = None
    editorial_tone_taxonomy: Optional[TaxonomyInput] = None

class ApprovalRequest(BaseModel):
    approved: bool
    feedback: Optional[str] = ""
