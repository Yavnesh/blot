from typing import TypedDict, Annotated, List, Dict, Any, Optional
import operator

class ArticleState(TypedDict):
    """
    State Dictionary for LangGraph Cyclical Orchestration.
    Represents the unified 'Memory' passed explicitly between swarm nodes.
    """
    job_id: str
    org_id: int
    
    # 1. Topic & Goal Parameters
    user_topic: Optional[str]
    topic_id: Optional[int]
    resolved_topic: Optional[str]
    context_document_ids: Optional[List[int]] = []
    research_mode: str = "hybrid" # vault, web, hybrid
    pipeline_type: str # 'blog' or 'instagram'
    instagram_format: Optional[str]
    tone: Optional[str]
    audience: Optional[str]
    word_count_target: Optional[int]
    target_audience_taxonomy: Optional[Dict[str, Any]]
    editorial_tone_taxonomy: Optional[Dict[str, Any]]

    
    # 2. Research Data
    reuse_scrape: bool
    serp_data: List[Dict[str, Any]]
    verified_claims: List[str]
    keyword_clusters: List[str]
    primary_keyword: Optional[str]
    search_intent: Optional[str]
    serp_blueprint: Optional[Dict[str, Any]]
    
    # 3. Content Lifecycle
    # 'Annotated[..., operator.add]' allows LangGraph to APPEND to the array automatically
    draft_iterations: Annotated[List[str], operator.add] 
    current_draft: Optional[str]
    brand_voice_prompt: Optional[str]
    
    # 4. Evaluation Metrics
    seo_score: float
    readability_score: float
    originality_score: float
    legal_clearance: bool
    evaluation_feedback: Annotated[List[str], operator.add]
    seo_pack: Optional[Dict[str, Any]]
    personalization: Optional[Dict[str, Any]]
    
    # 5. Media & CRM
    include_images: bool
    image_provider: str
    cover_image: Optional[dict]
    all_images: List[dict]
    
    # 6. Reflection & HITL Control
    loop_count: int
    is_approved: bool # AI internal approval
    human_approved: bool # User external approval
    human_feedback: Optional[str]
    
    # System Context
    # 'Annotated[..., operator.add]' allows LangGraph to APPEND to the array automatically
    logs: Annotated[List[str], operator.add]

