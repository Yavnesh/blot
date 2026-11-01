from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, get_current_active_org, require_role
from app.models.user import User, Organization
from app.models.post import Post
from app.models.social_account import SocialAccount
from app.models.enums import ReviewStatus
from app.schemas.social_account import SocialAccountCreate, SocialAccountOut, PublishPostRequest

router = APIRouter()

@router.get("/accounts", response_model=List[SocialAccountOut])
def list_social_accounts(
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_active_org),
    _role: User = Depends(require_role("admin", "manager", "creator"))
):
    """List all connected social media accounts for the active organization."""
    return db.query(SocialAccount).filter(SocialAccount.org_id == current_org.id, SocialAccount.is_active == True).all()

@router.post("/accounts", response_model=SocialAccountOut, status_code=status.HTTP_201_CREATED)
def connect_social_account(
    account_in: SocialAccountCreate,
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_active_org),
    _role: User = Depends(require_role("admin", "manager"))
):
    """Connect a new OAuth social account (Admin and Manager only)."""
    account = SocialAccount(
        org_id=current_org.id,
        project_id=account_in.project_id,
        platform=account_in.platform.lower(),
        account_id=account_in.account_id,
        account_name=account_in.account_name,
        access_token=account_in.access_token,
        refresh_token=account_in.refresh_token,
        token_expires_at=account_in.token_expires_at,
        metadata_info=account_in.metadata_info or {}
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

@router.post("/publish/{post_id}", response_model=dict)
def publish_post(
    post_id: int,
    publish_in: PublishPostRequest,
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_active_org),
    _role: User = Depends(require_role("admin", "manager"))
):
    """
    Manager action: Triggers automated publishing of a manager-approved post
    to the designated social media channel.
    """
    post = db.query(Post).filter(Post.id == post_id, Post.org_id == current_org.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.review_status != ReviewStatus.MANAGER_APPROVED.value:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot publish post. Status is '{post.review_status}', but requires 'manager_approved'."
        )

    account = db.query(SocialAccount).filter(
        SocialAccount.id == publish_in.social_account_id,
        SocialAccount.org_id == current_org.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found in organization")

    from app.tasks.publishing_tasks import publish_post_task
    publish_post_task.delay(post_id=post.id, social_account_id=account.id)

    return {
        "message": f"Publishing dispatched to {account.platform}.",
        "post_id": post.id,
        "platform": account.platform
    }
