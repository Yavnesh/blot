from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.db.base_class import Base

class WorkspaceAsset(Base):
    """
    Represents an uploaded knowledge asset (PDF, Doc, Style Guide) for an organization.
    """
    __tablename__ = "workspace_assets"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    file_type = Column(String) # 'pdf', 'markdown', 'txt'
    s3_path = Column(String)
    status = Column(String, default="processing") # processing, ready, error
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    embeddings = relationship("AssetEmbedding", back_populates="asset", cascade="all, delete-orphan")

class AssetEmbedding(Base):
    """
    Stores vectorized chunks of workspace assets for semantic retrieval.
    """
    __tablename__ = "asset_embeddings"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("workspace_assets.id"), index=True, nullable=False)
    chunk_content = Column(Text, nullable=False)
    # 768 is the standard dimension for Google Gemini 'text-embedding-004' / 'embedding-001'
    embedding = Column(Vector(768)) 
    metadata_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    asset = relationship("WorkspaceAsset", back_populates="embeddings")

# Define the HNSW index for the embedding column
Index('idx_asset_embedding_hnsw', AssetEmbedding.embedding, postgresql_using='hnsw', postgresql_with={'m': 16, 'ef_construction': 64}, postgresql_ops={'embedding': 'vector_cosine_ops'})
