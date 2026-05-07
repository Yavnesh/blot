from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import EmailStr

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.schemas.user import Token, User as UserSchema

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, retrieve an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "refresh_token": security.create_refresh_token(user.id),
        "token_type": "bearer",
    }

@router.post("/signup", response_model=UserSchema)
def create_user_signup(
    *,
    db: Session = Depends(deps.get_db),
    password: str = Body(...),
    email: EmailStr = Body(...),
    full_name: str = Body(None),
    org_name: str = Body(None),
) -> Any:
    """
    Create new user without the need to be logged in
    """
    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    
    new_user = User(
        email=email,
        hashed_password=security.get_password_hash(password),
        full_name=full_name,
    )
    db.add(new_user)
    db.flush() # Get user id

    # Create Organization
    from app.models.user import Organization
    final_org_name = org_name or f"{full_name}'s Org"
    slug = final_org_name.lower().replace(" ", "-")
    
    # Check if slug exists, if so append random
    existing_org = db.query(Organization).filter(Organization.slug == slug).first()
    if existing_org:
        import uuid
        slug = f"{slug}-{str(uuid.uuid4())[:4]}"

    new_org = Organization(
        name=final_org_name,
        slug=slug
    )
    db.add(new_org)
    db.flush() # Get org id

    # Link User to Organization as owner
    from app.models.user import user_organization
    db.execute(
        user_organization.insert().values(
            user_id=new_user.id,
            organization_id=new_org.id,
            role="owner"
        )
    )

    db.commit()
    db.refresh(new_user)
    return new_user
@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.post("/forgot-password")
def forgot_password(
    email: EmailStr = Body(..., embed=True),
    db: Session = Depends(deps.get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if user:
        token = security.create_reset_token(email)
        # TODO: integrate with SendGrid/SES to send email
        from loguru import logger
        logger.info(f"Password reset token for {email}: {token}")
    return {"message": "If that email is registered, you will receive a reset link shortly."}

@router.post("/reset-password")
def reset_password(
    token: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    db: Session = Depends(deps.get_db)
):
    email = security.verify_reset_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = security.get_password_hash(new_password)
    db.commit()
    return {"message": "Password updated successfully"}
