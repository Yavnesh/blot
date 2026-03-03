import os
from loguru import logger
import sentry_sdk
from prometheus_client import Counter, Histogram, start_http_server

# Sentry Initialization
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(dsn=SENTRY_DSN, traces_sample_rate=1.0)

# Prometheus Metrics
AGENT_LATENCY = Histogram("agent_latency_seconds", "Latency of agent execution", ["agent_name"])
AGENT_ERRORS = Counter("agent_errors_total", "Total count of agent errors", ["agent_name"])
API_COST = Counter("api_cost_usd", "Total accumulated API cost", ["job_id"])

def start_metrics_server(port: int = 9090):
    start_http_server(port)
    logger.info(f"Prometheus metrics server started on port {port}")

# Structured Logging Config (JSON)
def setup_logging():
    import sys
    import json
    
    def serializer(record):
        subset = {
            "timestamp": record["elapsed"].total_seconds(),
            "level": record["level"].name,
            "message": record["message"],
            "extra": record["extra"]
        }
        return json.dumps(subset)

    logger.remove()
    logger.add(sys.stdout, format="{message}", serialize=True)
    logger.info("Structured JSON logging enabled")

def setup_observability(app):
    """
    Main entry point for setting up observability in the FastAPI app.
    """
    setup_logging()
    # If Sentry DSN is missing, we could add fallback logic here
    logger.info("Observability setup complete")
