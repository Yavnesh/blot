from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base

class TrustSource(Base):
    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, unique=True, index=True)
    authority_score = Column(Float, default=0.0) # Moz DA or similar
    trust_score = Column(Float, default=0.0)     # Internal trust metric
    last_verified = Column(DateTime(timezone=True), onupdate=func.now())
    category = Column(String, default="General")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
