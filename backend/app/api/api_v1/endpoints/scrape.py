from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.scrape import Scrape
from app.schemas.scrape import ScrapeCreate, ScrapeUpdate, Scrape as ScrapeSchema

router = APIRouter()

@router.get("/", response_model=List[ScrapeSchema])
def read_scrapes(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve scrapes.
    """
    scrapes = db.query(Scrape).offset(skip).limit(limit).all()
    return scrapes

@router.post("/", response_model=ScrapeSchema)
def create_scrape(
    *,
    db: Session = Depends(deps.get_db),
    scrape_in: ScrapeCreate,
) -> Any:
    """
    Create new scrape.
    """
    scrape = Scrape(**scrape_in.model_dump())
    db.add(scrape)
    db.commit()
    db.refresh(scrape)
    return scrape

@router.get("/{scrape_id}", response_model=ScrapeSchema)
def read_scrape(
    *,
    db: Session = Depends(deps.get_db),
    scrape_id: int,
) -> Any:
    """
    Get scrape by ID.
    """
    scrape = db.query(Scrape).filter(Scrape.id == scrape_id).first()
    if not scrape:
        raise HTTPException(status_code=404, detail="Scrape not found")
    return scrape

@router.put("/{scrape_id}", response_model=ScrapeSchema)
def update_scrape(
    *,
    db: Session = Depends(deps.get_db),
    scrape_id: int,
    scrape_in: ScrapeUpdate,
) -> Any:
    """
    Update a scrape.
    """
    scrape = db.query(Scrape).filter(Scrape.id == scrape_id).first()
    if not scrape:
        raise HTTPException(status_code=404, detail="Scrape not found")
    update_data = scrape_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(scrape, field, value)
    db.add(scrape)
    db.commit()
    db.refresh(scrape)
    return scrape

@router.delete("/{scrape_id}", response_model=ScrapeSchema)
def delete_scrape(
    *,
    db: Session = Depends(deps.get_db),
    scrape_id: int,
) -> Any:
    """
    Delete a scrape.
    """
    scrape = db.query(Scrape).filter(Scrape.id == scrape_id).first()
    if not scrape:
        raise HTTPException(status_code=404, detail="Scrape not found")
    db.delete(scrape)
    db.commit()
    return scrape
