import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, Organization
from app.models.rag import WorkspaceAsset, AssetEmbedding
from app.tasks.rag_tasks import process_workspace_asset_task
from loguru import logger
from app.agents.intelligence.context_agent import ContextExtractorAgent

router = APIRouter()

UPLOAD_DIR = "/Users/yavnesh/Workplace/blot/backend/app/static/uploads/context/"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=dict)
async def upload_context_document(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_org: Organization = Depends(deps.get_current_active_org),
    current_user: User = Depends(deps.get_current_active_user),
    _role_check = Depends(deps.require_role("owner", "editor"))
):
    """
    Upload an organization document (PDF, Docx, MD, TXT).
    Saves to disk and triggers an asynchronous Celery task for vectorization.
    """
    file_ext = file.filename.split(".")[-1].lower()
    allowed = ["pdf", "docx", "md", "txt", "markdown", "xlsx", "xls", "csv", "pptx", "jpg", "png", "jpeg", "webp"]
    if file_ext not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    # Generate a unique storage name
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Create Asset Entry in DB
        new_asset = WorkspaceAsset(
            org_id=current_org.id,
            name=file.filename,
            file_type=file_ext,
            s3_path=file_path,  # Store full path for worker
            status="processing"
        )
        db.add(new_asset)
        db.commit()
        db.refresh(new_asset)

        # TRIGGER CELERY TASK
        process_workspace_asset_task.delay(new_asset.id)
        
        logger.info(f"Asset {new_asset.id} uploaded by {current_user.email} (Org: {current_org.id})")
        return {
            "id": new_asset.id,
            "filename": new_asset.name,
            "status": new_asset.status,
            "message": "Upload successful. Vectorization is happening in the background."
        }
    except Exception as e:
        logger.error(f"Failed to handle upload: {e}")
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail="Critical upload failure")

@router.get("/", response_model=List[dict])
def list_context_documents(
    db: Session = Depends(deps.get_db),
    current_org: Organization = Depends(deps.get_current_active_org)
):
    """
    List all knowledge assets available to the current organization.
    """
    assets = db.query(WorkspaceAsset).filter(WorkspaceAsset.org_id == current_org.id).all()
    return [
        {
            "id": a.id,
            "name": a.name,
            "file_type": a.file_type,
            "status": a.status,
            "created_at": a.created_at
        }
        for a in assets
    ]

@router.delete("/{asset_id}")
def delete_context_document(
    asset_id: int,
    db: Session = Depends(deps.get_db),
    current_org: Organization = Depends(deps.get_current_active_org),
    _role_check = Depends(deps.require_role("owner", "editor"))
):
    """
    Delete an organization asset and its corresponding embeddings.
    """
    asset = db.query(WorkspaceAsset).filter(
        WorkspaceAsset.id == asset_id, 
        WorkspaceAsset.org_id == current_org.id
    ).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    try:
        # Remove physical file
        if asset.s3_path and os.path.exists(asset.s3_path):
            os.remove(asset.s3_path)
            
        db.delete(asset)
        db.commit()
        return {"id": asset_id, "message": "Successfully deleted from knowledge base."}
    except Exception as e:
        logger.error(f"Failed to delete asset {asset_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete asset")

@router.post("/extract-website", response_model=dict)
async def extract_company_context(
    website_url: str = Query(..., description="The company website URL to analyze"),
    db: Session = Depends(deps.get_db),
    current_org: Organization = Depends(deps.get_current_active_org),
    _role_check = Depends(deps.require_role("owner", "editor"))
):
    """
    Scrapes the provided website and extracts a structured company profile.
    Updates the organization's brand settings automatically.
    """
    agent = ContextExtractorAgent()
    result = await agent.run({"website_url": website_url})
    
    if result.status != "success":
        raise HTTPException(status_code=400, detail=result.feedback)
        
    profile = result.data
    
    # Update Organization Profile
    current_org.description = profile.get("description")
    current_org.industry = profile.get("industry")
    current_org.target_audience = profile.get("target_audience")
    current_org.geography = profile.get("geography")
    current_org.usp = profile.get("usp")
    current_org.products_services = profile.get("products_services")
    current_org.brand_voice = profile.get("brand_voice")
    current_org.brand_tone = profile.get("brand_tone")
    current_org.key_messages = profile.get("key_messages")
    current_org.preferred_keywords = profile.get("keywords")
    
    db.commit()
    db.refresh(current_org)
    
from fastapi.responses import FileResponse

import mimetypes

@router.get("/{asset_id}/file")
def get_context_document_file(
    asset_id: int,
    db: Session = Depends(deps.get_db),
    current_org: Organization = Depends(deps.get_current_active_org)
):
    """
    Returns the physical file for the given asset ID.
    Used for viewing/downloading from the Knowledge Vault.
    """
    asset = db.query(WorkspaceAsset).filter(
        WorkspaceAsset.id == asset_id,
        WorkspaceAsset.org_id == current_org.id
    ).first()

    if not asset or not asset.s3_path:
        raise HTTPException(status_code=404, detail="Asset file not found")

    if not os.path.exists(asset.s3_path):
        logger.error(f"File missing on disk: {asset.s3_path}")
        raise HTTPException(status_code=404, detail="File missing on disk")

    # Detect MIME type
    mime_type, _ = mimetypes.guess_type(asset.s3_path)
    if not mime_type:
        mime_type = "application/octet-stream"

    return FileResponse(
        path=asset.s3_path,
        filename=asset.name,
        media_type=mime_type
    )
