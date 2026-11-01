from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import Organization, User, user_organization
from app.schemas.user import Organization as OrganizationSchema
from pydantic import EmailStr
from app.core import security
from loguru import logger

router = APIRouter()

@router.put("/{org_id}", response_model=OrganizationSchema)
def update_organization(
    *,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
    current_org: Organization = Depends(deps.get_current_active_org),
    org_id: int,
    org_in: dict = Body(...),
    _role_check = Depends(deps.require_role("owner", "editor"))
) -> Any:
    """
    Update organization details.
    """
    organization = db.query(Organization).filter(Organization.id == org_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    if organization.id != current_org.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    for field, value in org_in.items():
        if hasattr(organization, field):
            setattr(organization, field, value)
    
    db.add(organization)
    db.commit()
    db.refresh(organization)
    return organization

@router.post("/{org_id}/invite")
def invite_user(
    *,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
    current_org: Organization = Depends(deps.get_current_active_org),
    org_id: int,
    email: EmailStr = Body(..., embed=True),
    role: str = Body(..., embed=True),
    _role_check = Depends(deps.require_role("owner"))
) -> Any:
    """
    Invite a user to the organization. Only owners can invite.
    """
    if org_id != current_org.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    if role not in ["owner", "editor", "member"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    token = security.create_invite_token(email, org_id, role)
    # TODO: integrate with SendGrid/SES to send email
    logger.info(f"Invite token for {email} to org {org_id} as {role}: {token}")
    
    return {"message": "Invite sent successfully"}

@router.post("/accept-invite")
def accept_invite(
    *,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
    token: str = Body(..., embed=True)
) -> Any:
    """
    Accept an invitation to join an organization.
    """
    invite_data = security.verify_invite_token(token)
    if not invite_data:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")
        
    if current_user.email != invite_data["email"]:
        raise HTTPException(status_code=400, detail="This invite is for a different email address")
        
    org_id = invite_data["org_id"]
    role = invite_data["role"]
    
    # Check if already a member
    existing = db.execute(
        user_organization.select().where(
            user_organization.c.user_id == current_user.id,
            user_organization.c.organization_id == org_id
        )
    ).first()
    
    if existing:
        return {"message": "Already a member of this organization"}
        
    # Add user to org
    db.execute(
        user_organization.insert().values(
            user_id=current_user.id,
            organization_id=org_id,
            role=role
        )
    )
    db.commit()
    
    return {"message": "Successfully joined the organization"}
