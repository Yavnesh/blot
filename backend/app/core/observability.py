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
    
    # 1. Prometheus Instrumentator (Automatic RED Metrics for FastAPI)
    from prometheus_fastapi_instrumentator import Instrumentator
    Instrumentator().instrument(app).expose(app)
    
    # 2. OpenTelemetry Initialization
    import os
    if os.getenv("ENABLE_TRACING", "false").lower() == "true":
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        
        # Configure Tracer
        provider = TracerProvider()
        
        # Setup OTLP Exporter (sending traces to Jaeger or an OpenTelemetry Collector)
        otlp_endpoint = os.getenv("OTLP_ENDPOINT", "http://localhost:4317")
        processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True))
        provider.add_span_processor(processor)
        trace.set_tracer_provider(provider)
        
        # Instrument FastAPI
        FastAPIInstrumentor.instrument_app(app)
        
        # Optional: Instrument HTTPX and requests
        try:
            from opentelemetry.instrumentation.requests import RequestsInstrumentor
            RequestsInstrumentor().instrument()
        except ImportError:
            pass
            
        try:
            from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
            HTTPXClientInstrumentor().instrument()
        except ImportError:
            pass
            
        logger.info(f"OpenTelemetry tracing enabled -> {otlp_endpoint}")

    logger.info("Observability (Sentry / Prometheus / OTel) setup complete")
