from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from app.api import deps
from app.services.stripe_service import stripe_service
from app.models.user import Organization
from typing import Any

router = APIRouter()

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: Session = Depends(deps.get_db)
):
    """
    Stripe webhook endpoint to handle asynchronous payment events.
    """
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        
    payload = await request.body()
    return stripe_service.handle_webhook(db, payload, stripe_signature)

@router.post("/create-checkout-session")
def create_checkout_session(
    plan_id: str,
    db: Session = Depends(deps.get_db),
    current_org: Organization = Depends(deps.get_current_active_org),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Create a Stripe Checkout Session for a subscription.
    """
    checkout_url = stripe_service.create_checkout_session(current_org.id, plan_id)
    return {"checkout_url": checkout_url}
