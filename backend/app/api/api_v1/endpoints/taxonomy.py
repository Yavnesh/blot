from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.models.taxonomy import Category, PrimarySubcategory, SecondarySubcategory
from pydantic import BaseModel

router = APIRouter()

# Schemas
class SecondarySubcategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class PrimarySubcategoryOut(BaseModel):
    id: int
    name: str
    secondary_subcategories: List[SecondarySubcategoryOut]

    class Config:
        from_attributes = True

class CategoryOut(BaseModel):
    id: int
    name: str
    primary_subcategories: List[PrimarySubcategoryOut]

    class Config:
        from_attributes = True

@router.get("/", response_model=List[CategoryOut])
def get_taxonomy(db: Session = Depends(deps.get_db)):
    """
    Get the complete content taxonomy hierarchy.
    """
    return db.query(Category).order_by(Category.name).all()
