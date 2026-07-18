from slowapi import Limiter
from slowapi.util import get_remote_address
from app.config.settings import settings
import logging

logger = logging.getLogger("foretrace")

storage_uri = settings.redis_url if settings.redis_url else "memory://"
logger.info(f"Initializing slowapi rate limiter with storage: {storage_uri}")
limiter = Limiter(key_func=get_remote_address, storage_uri=storage_uri)
