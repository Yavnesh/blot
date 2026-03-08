
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True, # Recommended for PostgreSQL to handle idle connections
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
