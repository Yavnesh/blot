from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Table, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

# Association Table for User-Organization relationship
user_organization = Table(
    "user_organization",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("organization_id", Integer, ForeignKey("organizations.id"), primary_key=True),
    Column("role", String, default="member") # owner, editor, member
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Personalization Fields
    role_position = Column(String, nullable=True)
    writing_preference = Column(String, nullable=True) 
    audience_familiarity = Column(String, nullable=True)
    onboarding_completed = Column(Boolean, default=False)

    organizations = relationship("Organization", secondary=user_organization, back_populates="users")

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    plan_id = Column(String, default="free")
    subscription_status = Column(String, default="inactive")
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean(), default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Company Profile Fields
    industry = Column(String, nullable=True)
    description = Column(String, nullable=True)
    brand_voice = Column(String, nullable=True)
    brand_tone = Column(String, nullable=True)
    target_audience = Column(String, nullable=True)
    products_services = Column(String, nullable=True)
    usp = Column(String, nullable=True)
    content_goals = Column(String, nullable=True)
    preferred_keywords = Column(String, nullable=True)
    geography = Column(String, nullable=True)
    key_messages = Column(String, nullable=True)
    competitors = Column(String, nullable=True)
    personalization_enabled = Column(Boolean, default=True)
    blog_sources = Column(JSON, default=list)
    instagram_sources = Column(JSON, default=list)

    users = relationship("User", secondary=user_organization, back_populates="organizations")

