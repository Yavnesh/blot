from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

    primary_subcategories = relationship(
        "PrimarySubcategory", 
        back_populates="category", 
        cascade="all, delete-orphan"
    )


class PrimarySubcategory(Base):
    __tablename__ = "primary_subcategories"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, index=True)

    category = relationship("Category", back_populates="primary_subcategories")
    secondary_subcategories = relationship(
        "SecondarySubcategory", 
        back_populates="primary_subcategory", 
        cascade="all, delete-orphan"
    )


class SecondarySubcategory(Base):
    __tablename__ = "secondary_subcategories"

    id = Column(Integer, primary_key=True, index=True)
    primary_subcategory_id = Column(Integer, ForeignKey("primary_subcategories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, index=True)

    primary_subcategory = relationship("PrimarySubcategory", back_populates="secondary_subcategories")


class PostTaxonomy(Base):
    __tablename__ = "post_taxonomies"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("post.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    primary_subcategory_id = Column(Integer, ForeignKey("primary_subcategories.id", ondelete="CASCADE"), nullable=False)
    secondary_subcategory_ids = Column(JSON, nullable=False, default=[]) # List of integers
