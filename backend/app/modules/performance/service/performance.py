from typing import List
from sqlalchemy.orm import Session
from app.models.modular_models import PerformanceMetric

class PerformanceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_post_metrics(self, post_id: int) -> List[PerformanceMetric]:
        return self.db.query(PerformanceMetric).filter(PerformanceMetric.post_id == post_id).all()

    def add_metric(self, post_id: int, impressions: int, clicks: int, ctr: float, position: float):
        metric = PerformanceMetric(
            post_id=post_id,
            impressions=impressions,
            clicks=clicks,
            ctr=ctr,
            position=position
        )
        self.db.add(metric)
        self.db.commit()
        return metric

class PerformanceService:
    def __init__(self, db: Session):
        self.repo = PerformanceRepository(db)

    def track_engagement(self, post_id: int, data: dict):
        # Implementation for ingestion of GSC or Analytics data
        return self.repo.add_metric(
            post_id=post_id,
            impressions=data.get("impressions", 0),
            clicks=data.get("clicks", 0),
            ctr=data.get("ctr", 0.0),
            position=data.get("position", 0.0)
        )
