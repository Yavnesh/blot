from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.trending import Trending
from app.schemas.trending import TrendingCreate, TrendingUpdate, Trending as TrendingSchema

router = APIRouter()

@router.get("/", response_model=List[TrendingSchema])
def read_trendings(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve trendings.
    """
    trendings = db.query(Trending).order_by(Trending.created_at.desc()).offset(skip).limit(limit).all()
    return trendings

@router.post("/", response_model=TrendingSchema)
def create_trending(
    *,
    db: Session = Depends(deps.get_db),
    trending_in: TrendingCreate,
) -> Any:
    """
    Create new trending topic.
    """
    trending = Trending(**trending_in.model_dump())
    db.add(trending)
    db.commit()
    db.refresh(trending)
    return trending

@router.get("/{id}", response_model=TrendingSchema)
def read_trending(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get trending topic by ID.
    """
    trending = db.query(Trending).filter(Trending.id == id).first()
    if not trending:
        raise HTTPException(status_code=404, detail="Trending topic not found")
    return trending

@router.put("/{id}", response_model=TrendingSchema)
def update_trending(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    trending_in: TrendingUpdate,
) -> Any:
    """
    Update a trending topic.
    """
    trending = db.query(Trending).filter(Trending.id == id).first()
    if not trending:
        raise HTTPException(status_code=404, detail="Trending topic not found")
    update_data = trending_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trending, field, value)
    db.add(trending)
    db.commit()
    db.refresh(trending)
    return trending

@router.delete("/{id}", response_model=TrendingSchema)
def delete_trending(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Delete a trending topic.
    """
    trending = db.query(Trending).filter(Trending.id == id).first()
    if not trending:
        raise HTTPException(status_code=404, detail="Trending topic not found")
    db.delete(trending)
    db.commit()
    return trending
