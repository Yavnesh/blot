import redis.asyncio as redis
from app.core.config import settings

# Global redis pool
redis_client = redis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True
)

async def publish_update(channel: str, message: dict):
    """Publish a JSON message to a Redis channel."""
    import json
    import redis.asyncio as redis
    from app.core.config import settings
    
    # Create an ephemeral client to avoid loop conflicts in Celery/async_to_sync
    client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        await client.publish(channel, json.dumps(message))
    finally:
        await client.close()
