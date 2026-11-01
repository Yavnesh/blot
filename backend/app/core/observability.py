import os
import sys
import json
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Prometheus Metrics
try:
    from prometheus_client import Counter, Histogram
    AGENT_LATENCY = Histogram("agent_latency_seconds", "Latency of agent execution", ["agent_name"])
    AGENT_ERRORS = Counter("agent_errors_total", "Total count of agent errors", ["agent_name"])
    API_COST = Counter("api_cost_usd", "Total accumulated API cost", ["job_id"])
except Exception:
    pass

def setup_logging():
    """
    Configure clean structured logging for development and production.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )

def setup_observability(app):
    """
    Main entry point for setting up observability in the FastAPI app.
    """
    setup_logging()
    
    # Initialize Sentry if configured
    if getattr(settings, "SENTRY_DSN", None):
        try:
            import sentry_sdk
            sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=1.0)
            logger.info("Sentry APM initialized.")
        except Exception as e:
            logger.warning(f"Failed to initialize Sentry: {e}")

    logger.info("Observability setup complete.")

def get_langfuse_callback_handler(trace_name: str = "orchestrator_pipeline", user_id: Optional[str] = None, metadata: Optional[dict] = None):
    """
    Returns a Langfuse CallbackHandler for LangChain / LangGraph if keys are configured.
    Falls back gracefully to None if Langfuse is not installed or unconfigured.
    """
    if not (getattr(settings, "LANGFUSE_PUBLIC_KEY", None) and getattr(settings, "LANGFUSE_SECRET_KEY", None)):
        return None

    try:
        from langfuse.callback import CallbackHandler
        handler = CallbackHandler(
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
            host=settings.LANGFUSE_HOST,
            trace_name=trace_name,
            user_id=str(user_id) if user_id else None,
            metadata=metadata or {}
        )
        return handler
    except Exception as e:
        logger.warning(f"Failed to initialize Langfuse callback handler: {e}")
        return None
