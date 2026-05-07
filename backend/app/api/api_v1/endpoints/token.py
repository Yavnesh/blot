from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core import security
from app.api.deps import get_db
from app.models.user import User

router = APIRouter()


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
def refresh_access_token(
    request: RefreshRequest,
    db: Session = Depends(get_db),
) -> Any:
    """
    Exchange a valid refresh token for a new access token.
    The refresh token itself is not rotated (long-lived).
    """
    try:
        payload = jwt.decode(
            request.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type. Expected refresh token.")
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token payload.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive.")

    return {
        "access_token": security.create_access_token(user.id),
        "token_type": "bearer",
    }
