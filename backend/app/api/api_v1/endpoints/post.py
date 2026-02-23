from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate, Post as PostSchema

router = APIRouter()

@router.get("/", response_model=List[PostSchema])
def read_posts(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve posts.
    """
    posts = db.query(Post).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts

@router.post("/", response_model=PostSchema)
def create_post(
    *,
    db: Session = Depends(deps.get_db),
    post_in: PostCreate,
) -> Any:
    """
    Create new post.
    """
    post = Post(**post_in.model_dump())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.get("/{id}", response_model=PostSchema)
def read_post(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get post by ID.
    """
    post = db.query(Post).filter(Post.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.put("/{id}", response_model=PostSchema)
def update_post(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    post_in: PostUpdate,
) -> Any:
    """
    Update a post.
    """
    post = db.query(Post).filter(Post.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    update_data = post_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.delete("/{id}", response_model=PostSchema)
def delete_post(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Delete a post.
    """
    post = db.query(Post).filter(Post.id == id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return post
