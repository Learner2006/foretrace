from slowapi import Limiter
from fastapi import Request
from app.config.settings import settings
import logging

logger = logging.getLogger("foretrace")

def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

storage_uri = settings.redis_url if settings.redis_url else "memory://"
logger.info(f"Initializing slowapi rate limiter with storage: {storage_uri}")
limiter = Limiter(key_func=get_client_ip, storage_uri=storage_uri)
