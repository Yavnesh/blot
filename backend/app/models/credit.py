from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from app.db.base_class import Base

class CreditLedger(Base):
    __tablename__ = "credit_ledger"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False) # positive for add, negative for burn
    type = Column(String, nullable=False) # 'purchase', 'burn', 'refund', 'bonus'
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
