from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.seo_audit import SEOAuditService

router = APIRouter()

class AuditRequest(BaseModel):
    content: str
    topic: str = "Automated Audit"

@router.post("/audit")
async def perform_seo_audit(request: AuditRequest) -> Any:
    """
    Perform a deep SEO audit on the provided content.
    This endpoint is part of the SEO Optimization SaaS pipeline.
    """
    if not request.content or len(request.content) < 50:
        raise HTTPException(status_code=400, detail="Content too short for a meaningful SEO audit.")
    
    service = SEOAuditService()
    report = await service.audit_content(request.content, request.topic)
    
    if not report["success"]:
        raise HTTPException(status_code=500, detail=report["error"])
    
    return report
