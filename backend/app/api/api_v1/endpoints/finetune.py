from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.fine_tune_data import FineTuneData
from app.schemas.fine_tune_data import FineTuneData as FineTuneDataSchema

router = APIRouter()

@router.get("/samples", response_model=List[FineTuneDataSchema])
def read_finetune_samples(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 5,
) -> Any:
    """
    Retrieve fine-tuning data samples.
    """
    samples = db.query(FineTuneData).order_by(FineTuneData.created_at.desc()).offset(skip).limit(limit).all()
    return samples
