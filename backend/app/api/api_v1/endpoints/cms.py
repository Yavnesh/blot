from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.post import Post
from app.models.user import Organization
from app.services.cms_service import cms_service
from pydantic import BaseModel

router = APIRouter()

class CMSPublishRequest(BaseModel):
    platform: str # 'wordpress', 'ghost', 'shopify', 'webhook'
    credentials: dict # e.g. {'url': '...', 'username': '...'} or {'webhookUrl': '...'}

@router.post("/{post_id}/publish-cms", response_model=dict)
def publish_to_cms(
    *, 
    db: Session = Depends(deps.get_db), 
    post_id: int, 
    request: CMSPublishRequest,
    current_org: Organization = Depends(deps.get_current_active_org)
) -> Any:
    """
    Publish a generated article to an external CMS.
    """
    post = db.query(Post).filter(Post.id == post_id, Post.org_id == current_org.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    post_data = {
        "title": post.title[0] if isinstance(post.title, list) and post.title else "Untitled",
        "content": post.content[0] if isinstance(post.content, list) and post.content else "",
        "seo_data": post.seo_data
    }
    
    if request.platform == "wordpress":
        result = cms_service.publish_to_wordpress(current_org.id, post_data, request.credentials)
    elif request.platform == "ghost":
        result = cms_service.publish_to_ghost(current_org.id, post_data, request.credentials)
    elif request.platform == "shopify":
        result = cms_service.publish_to_shopify(current_org.id, post_data, request.credentials)
    elif request.platform == "webhook":
        result = cms_service.trigger_webhook(current_org.id, post_data, request.credentials.get("webhookUrl"))
    else:
        raise HTTPException(status_code=400, detail="Unsupported CMS platform")
        
    # Optional: Log the publish event
    
    return result
