import stripe
from typing import Optional
from loguru import logger
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import Organization
from datetime import datetime, timezone

class StripeService:
    def __init__(self):
        stripe.api_key = settings.STRIPE_API_KEY

    def create_checkout_session(self, org_id: int, plan_id: str):
        """
        Create a Stripe Checkout Session for a subscription.
        """
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price": plan_id,
                    "quantity": 1,
                }],
                mode="subscription",
                success_url=f"{settings.FRONTEND_URL}/settings?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/settings",
                client_reference_id=str(org_id),
            )
            return session.url
        except Exception as e:
            logger.error(f"Stripe Error: {e}")
            return f"{settings.FRONTEND_URL}/settings?error=stripe_failure"

    def handle_webhook(self, db: Session, payload: bytes, sig_header: str):
        """
        Handles Stripe webhooks with signature validation.
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            # Invalid payload
            raise Exception("Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            raise Exception("Invalid signature")

        event_type = event["type"]
        data_object = event["data"]["object"]

        logger.info(f"Stripe Webhook: {event_type}")

        if event_type == "checkout.session.completed":
            self._handle_checkout_completed(db, data_object)
        elif event_type in ["customer.subscription.updated", "customer.subscription.deleted"]:
            self._handle_subscription_updated(db, data_object)

        return {"status": "success"}

    def _handle_checkout_completed(self, db: Session, session: dict):
        org_id = session.get("client_reference_id")
        subscription_id = session.get("subscription")
        customer_id = session.get("customer")

        if not org_id:
            return

        org = db.query(Organization).filter(Organization.id == int(org_id)).first()
        if org:
            org.stripe_customer_id = customer_id
            org.stripe_subscription_id = subscription_id
            org.subscription_status = "active"
            # Fetch subscription details to get plan and expiry
            subscription = stripe.Subscription.retrieve(subscription_id)
            org.plan_id = subscription["items"]["data"][0]["price"]["id"]
            org.current_period_end = datetime.fromtimestamp(subscription["current_period_end"], tz=timezone.utc)
            db.commit()
            logger.info(f"Provisioned subscription for Org {org_id}")

    def _handle_subscription_updated(self, db: Session, subscription: dict):
        sub_id = subscription.get("id")
        org = db.query(Organization).filter(Organization.stripe_subscription_id == sub_id).first()
        if org:
            org.subscription_status = subscription.get("status")
            org.plan_id = subscription["items"]["data"][0]["price"]["id"]
            org.current_period_end = datetime.fromtimestamp(subscription["current_period_end"], tz=timezone.utc)
            db.commit()
            logger.info(f"Updated subscription for Org {org.id}")

stripe_service = StripeService()
