
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.core.exceptions import global_exception_handler, http_exception_handler
from app.core.observability import setup_observability
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from prometheus_client import make_asgi_app

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Apply APM & Observability (Sentry, OpenTelemetry, JSON Logs)
setup_observability(app)

# Prometheus metrics endpoint
app.mount("/metrics", make_asgi_app())

app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


from fastapi.staticfiles import StaticFiles
import os

app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve static files
static_path = "app/static"
if not os.path.exists(static_path):
    os.makedirs(static_path, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")

@app.on_event("startup")
def startup_event():
    from app.db.base import Base
    from app.db.session import engine, SessionLocal
    from app.db.seed_taxonomy import seed_taxonomy
    
    # Automatically create missing tables
    Base.metadata.create_all(bind=engine)
    
    # Run migrations for existing organizations table if PostgreSQL
    if engine.dialect.name == "postgresql":
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS blog_sources JSON DEFAULT '[]'::json;"))
            conn.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS instagram_sources JSON DEFAULT '[]'::json;"))
    
    # Run the seeder
    db = SessionLocal()
    try:
        seed_taxonomy(db)
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Welcome to Blot CRM API"}
