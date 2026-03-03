from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Float, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.db.base_class import Base

# --- CORE TABLES ---

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    settings = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    keywords = relationship("Keyword", back_populates="project")
    briefs = relationship("ContentBrief", back_populates="project")

class Keyword(Base):
    __tablename__ = "keywords"
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(511), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    search_volume = Column(Integer, default=0)
    difficulty = Column(Integer, default=0)
    cluster_id = Column(String(255)) # For grouping related keywords
    status = Column(String(50), default="discovered") # discovered, active, archived
    
    project = relationship("Project", back_populates="keywords")
    snapshots = relationship("SERPSnapshot", back_populates="keyword")
    briefs = relationship("ContentBrief", back_populates="keyword")

class SERPSnapshot(Base):
    __tablename__ = "serp_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    keyword_id = Column(Integer, ForeignKey("keywords.id"))
    snapshot_data = Column(JSON, nullable=False) # Full SERP JSON
    search_date = Column(DateTime(timezone=True), server_default=func.now())
    
    keyword = relationship("Keyword", back_populates="snapshots")
    entities = relationship("SERPEntity", back_populates="snapshot")

class SERPEntity(Base):
    __tablename__ = "serp_entities"
    id = Column(Integer, primary_key=True, index=True)
    snapshot_id = Column(Integer, ForeignKey("serp_snapshots.id"))
    entity_name = Column(String(255), index=True)
    entity_type = Column(String(100)) # Organization, Person, Topic, etc.
    frequency = Column(Float, default=1.0)
    salience = Column(Float, default=0.0)
    vector = Column(Vector(768)) # For semantic similarity (assuming 768 for Gemini/Vertex)
    
    snapshot = relationship("SERPSnapshot", back_populates="entities")

class ContentBrief(Base):
    __tablename__ = "content_briefs"
    id = Column(Integer, primary_key=True, index=True)
    keyword_id = Column(Integer, ForeignKey("keywords.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    target_audience = Column(String(255))
    primary_intent = Column(String(100)) # informational, commercial, etc.
    secondary_intents = Column(JSON, default=[])
    core_topics = Column(JSON, default=[]) # Extracted from SERP intelligence
    word_count_target = Column(Integer, default=1200)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    keyword = relationship("Keyword", back_populates="briefs")
    project = relationship("Project", back_populates="briefs")
    outlines = relationship("Outline", back_populates="brief")

class Outline(Base):
    __tablename__ = "outlines"
    id = Column(Integer, primary_key=True, index=True)
    brief_id = Column(Integer, ForeignKey("content_briefs.id"))
    structure = Column(JSON, nullable=False) # H1, H2, H3 hierarchy
    version = Column(Integer, default=1)
    
    brief = relationship("ContentBrief", back_populates="outlines")
    drafts = relationship("Draft", back_populates="outline")

class Source(Base):
    __tablename__ = "sources"
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(1024), unique=True, index=True)
    title = Column(String(511))
    content = Column(Text)
    type = Column(String(50)) # news, blog, research_paper
    reliability_score = Column(Float, default=0.5)
    vector = Column(Vector(768))
    last_scraped = Column(DateTime(timezone=True), server_default=func.now())

class Draft(Base):
    __tablename__ = "drafts"
    id = Column(Integer, primary_key=True, index=True)
    outline_id = Column(Integer, ForeignKey("outlines.id"))
    content = Column(Text, nullable=False)
    coverage_score = Column(Float, default=0.0) # Semantic coverage [0,1]
    status = Column(String(50), default="draft") # draft, reviewed, published
    word_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    outline = relationship("Outline", back_populates="drafts")
    seo_metadata = relationship("SEOMetadata", uselist=False, back_populates="draft")

class SEOMetadata(Base):
    __tablename__ = "seo_metadata"
    id = Column(Integer, primary_key=True, index=True)
    draft_id = Column(Integer, ForeignKey("drafts.id"))
    title_tag = Column(String(255))
    meta_desc = Column(String(511))
    focus_keyword = Column(String(255))
    primary_slug = Column(String(255), index=True)
    schema_markup = Column(JSON, default={})
    
    draft = relationship("Draft", back_populates="seo_metadata")

class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, index=True) # ID in final publishing platform
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    ctr = Column(Float, default=0.0)
    position = Column(Float, default=0.0)
    tracked_at = Column(DateTime(timezone=True), server_default=func.now())

class RefreshTask(Base):
    __tablename__ = "refresh_tasks"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(100)) # serp_refresh, health_check, background_discovery
    params = Column(JSON, default={})
    status = Column(String(50), default="pending") # pending, running, completed, failed
    error = Column(Text)
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
