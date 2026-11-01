from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, get_current_active_org, require_role
from app.models.user import User, Organization
from app.models.post import Post
from app.models.review import PostReviewComment
from app.models.enums import ReviewStatus
from app.schemas.review import (
    CommentCreate,
    CommentOut,
    SubmitReviewRequest,
    ManagerDecisionRequest,
    PostReviewDetailsOut
)

router = APIRouter()

@router.get("/{post_id}", response_model=PostReviewDetailsOut)
def get_post_review_details(
    post_id: int,
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_active_org),
    _role: User = Depends(require_role("admin", "manager", "creator"))
):
    """Retrieve post review status, approval metadata, and feedback comments."""
    post = db.query(Post).filter(Post.id == post_id, Post.org_id == current_org.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments = db.query(PostReviewComment).filter(PostReviewComment.post_id == post.id).order_by(PostReviewComment.created_at.asc()).all()

    return PostReviewDetailsOut(
        post_id=post.id,
        org_id=post.org_id,
        project_id=post.project_id,
        review_status=post.review_status or "drafting",
        target_platform=post.target_platform or "blog",
        created_by_id=post.created_by_id,
        approved_by_id=post.approved_by_id,
        comments=comments
    )

@router.post("/{post_id}/comments", response_model=CommentOut)
def add_comment(
    post_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_active_org),
    current_user: User = Depends(get_current_active_user),
    _role: User = Depends(require_role("admin", "manager", "creator"))
):
    """Add a collaborative review comment to a post or specific pipeline node."""
    post = db.query(Post).filter(Post.id == post_id, Post.org_id == current_org.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = PostReviewComment(
        post_id=post.id,
        user_id=current_user.id,
        step_name=comment_in.step_name,
        comment_text=comment_in.comment_text
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

@router.post("/{post_id}/submit", response_model=dict)
def submit_for_manager_approval(
    post_id: int,
    submit_in: SubmitReviewRequest,
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_active_org),
    current_user: User = Depends(get_current_active_user),
    _role: User = Depends(require_role("creator", "manager", "admin"))
):
    """
    Content Creator action: Finalizes creator edits and submits draft
    to the organization's managers for final review.
    """
    post = db.query(Post).filter(Post.id == post_id, Post.org_id == current_org.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.review_status = ReviewStatus.SUBMITTED_TO_MANAGER.value
    if submit_in.notes:
        comment = PostReviewComment(
            post_id=post.id,
            user_id=current_user.id,
            step_name="submission_notes",
            comment_text=submit_in.notes
        )
        db.add(comment)

    db.commit()
    return {
        "message": "Post submitted to managers for review.",
        "post_id": post.id,
        "review_status": post.review_status
    }

@router.post("/{post_id}/decision", response_model=dict)
def manager_decision(
    post_id: int,
    decision_in: ManagerDecisionRequest,
    db: Session = Depends(get_db),
    current_org: Organization = Depends(get_current_active_org),
    current_user: User = Depends(get_current_active_user),
    _role: User = Depends(require_role("admin", "manager"))
):
    """
    Manager action: Review draft submitted by creators.
    Can either approve (ready for publishing) or request changes with notes.
    """
    post = db.query(Post).filter(Post.id == post_id, Post.org_id == current_org.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if decision_in.action == "approve":
        post.review_status = ReviewStatus.MANAGER_APPROVED.value
        post.approved_by_id = current_user.id
        message = "Post approved by manager. Ready for scheduling or instant publishing."
    elif decision_in.action == "request_changes":
        post.review_status = ReviewStatus.CHANGES_REQUESTED.value
        message = "Changes requested by manager. Returned to content creator."
    else:
        raise HTTPException(status_code=400, detail="Invalid decision action. Use 'approve' or 'request_changes'.")

    if decision_in.feedback:
        comment = PostReviewComment(
            post_id=post.id,
            user_id=current_user.id,
            step_name="manager_decision",
            comment_text=decision_in.feedback
        )
        db.add(comment)

    db.commit()
    return {
        "message": message,
        "post_id": post.id,
        "review_status": post.review_status,
        "approved_by_id": post.approved_by_id
    }
