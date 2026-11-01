from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    
    platform = Column(String(50), nullable=False) # linkedin, twitter, facebook, instagram, webflow
    account_id = Column(String(255), nullable=False)
    account_name = Column(String(255), nullable=False)
    
    # Secure token storage
    access_token = Column(String(1024), nullable=False)
    refresh_token = Column(String(1024), nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata for scopes, profile picture, page IDs
    metadata_info = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization")
    project = relationship("Project")
