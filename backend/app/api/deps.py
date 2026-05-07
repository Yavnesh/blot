from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.schemas.user import TokenPayload
from app.core import security
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User, Organization

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_active_org(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    x_organization_id: Optional[str] = Header(None)
) -> Organization:
    # If the user is a superuser and provided a header, allow them to switch orgs
    if x_organization_id and current_user.is_superuser:
        org = db.query(Organization).filter(Organization.id == int(x_organization_id)).first()
        if org:
            return org
    
    # Otherwise, check if the requested org is in the user's list
    if x_organization_id:
        org = next((o for o in current_user.organizations if str(o.id) == x_organization_id), None)
        if org:
            return org
        # Fallback if the requested org is not valid for the user
    
    # Defaults to the first organization for standard behavior
    if not current_user.organizations:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")
    
    return current_user.organizations[0]


def _get_user_role_in_org(db: Session, user_id: int, org_id: int) -> Optional[str]:
    """Query the user_organization association table for the user's role."""
    from app.models.user import user_organization
    row = db.execute(
        user_organization.select().where(
            user_organization.c.user_id == user_id,
            user_organization.c.organization_id == org_id,
        )
    ).first()
    return row.role if row else None


def require_role(*allowed_roles: str):
    """
    RBAC dependency factory. Usage:
        @router.post("/admin-only")
        def admin_endpoint(
            ...,
            _role_check = Depends(require_role("owner", "editor")),
        ):
    
    Superusers bypass the role check entirely.
    """
    def _role_checker(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user),
        current_org: Organization = Depends(get_current_active_org),
    ):
        # Superusers bypass RBAC
        if current_user.is_superuser:
            return current_user
        
        role = _get_user_role_in_org(db, current_user.id, current_org.id)
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {', '.join(allowed_roles)}. Your role: {role or 'none'}",
            )
        return current_user
    
    return _role_checker


def verify_quota(feature: str):
    """
    Enforces subscription quotas based on the feature.
    Usage:
        @router.post("/trigger")
        async def trigger_pipeline(..., _quota_check = Depends(verify_quota("generation")))
    """
    def _quota_checker(
        db: Session = Depends(get_db),
        current_org: Organization = Depends(get_current_active_org)
    ):
        # Stub for tier checking. Example: max_posts_per_month = 20 for Basic plan.
        # This assumes the organization object has `usage_posts_current_month` or similar
        # Since that schema might not exist, we will safely fallback.
        usage_posts = getattr(current_org, "usage_posts_current_month", 0)
        max_posts = 20 # default limit for standard plan
        
        if feature == "generation" and usage_posts >= max_posts:
            raise HTTPException(
                status_code=402, 
                detail="Monthly generation quota exceeded. Upgrade required."
            )
        return current_org
    
    return _quota_checker
