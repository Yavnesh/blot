from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.seo_audit import SEOAuditService
from app.api import deps
from app.models.user import User

router = APIRouter()

class AuditRequest(BaseModel):
    content: str
    topic: str = "Automated Audit"

@router.post("/audit")
async def perform_seo_audit(
    request: AuditRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Perform a deep SEO audit on the provided content.
    Requires authentication.
    """
    if not request.content or len(request.content) < 50:
        raise HTTPException(status_code=400, detail="Content too short for a meaningful SEO audit.")
    
    service = SEOAuditService()
    report = await service.audit_content(request.content, request.topic)
    
    if not report["success"]:
        raise HTTPException(status_code=500, detail=report["error"])
    
    return report
