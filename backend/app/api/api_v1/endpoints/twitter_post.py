from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.twitter_post import TwitterPost
from app.schemas.twitter_post import TwitterPostCreate, TwitterPostUpdate, TwitterPost as TwitterPostSchema

router = APIRouter()

@router.get("/", response_model=List[TwitterPostSchema])
def read_twitter_posts(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve twitter posts.
    """
    twitter_posts = db.query(TwitterPost).offset(skip).limit(limit).all()
    return twitter_posts

@router.post("/", response_model=TwitterPostSchema)
def create_twitter_post(
    *,
    db: Session = Depends(deps.get_db),
    twitter_post_in: TwitterPostCreate,
) -> Any:
    """
    Create new twitter post.
    """
    twitter_post = TwitterPost(**twitter_post_in.model_dump())
    db.add(twitter_post)
    db.commit()
    db.refresh(twitter_post)
    return twitter_post

@router.get("/{id}", response_model=TwitterPostSchema)
def read_twitter_post(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get twitter post by ID.
    """
    twitter_post = db.query(TwitterPost).filter(TwitterPost.id == id).first()
    if not twitter_post:
        raise HTTPException(status_code=404, detail="TwitterPost not found")
    return twitter_post

@router.put("/{id}", response_model=TwitterPostSchema)
def update_twitter_post(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    twitter_post_in: TwitterPostUpdate,
) -> Any:
    """
    Update a twitter post.
    """
    twitter_post = db.query(TwitterPost).filter(TwitterPost.id == id).first()
    if not twitter_post:
        raise HTTPException(status_code=404, detail="TwitterPost not found")
    update_data = twitter_post_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(twitter_post, field, value)
    db.add(twitter_post)
    db.commit()
    db.refresh(twitter_post)
    return twitter_post

@router.delete("/{id}", response_model=TwitterPostSchema)
def delete_twitter_post(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Delete a twitter post.
    """
    twitter_post = db.query(TwitterPost).filter(TwitterPost.id == id).first()
    if not twitter_post:
        raise HTTPException(status_code=404, detail="TwitterPost not found")
    db.delete(twitter_post)
    db.commit()
    return twitter_post
