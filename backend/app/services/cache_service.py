"""
In-memory analysis result cache for ForeTrace.
Caches completed analysis results per ticker so that repeated lookups
(e.g., CompanyPage + ComparePage for the same ticker) reuse the same run.

TTL: 1 hour — SEC filings don't change intraday.
Max size: 50 tickers — keep memory footprint small.
"""
import time
from collections import OrderedDict
from typing import Optional, Dict, Any
from app.utils.logger import logger

CACHE_TTL_SECONDS = 3600  # 1 hour
CACHE_MAX_SIZE = 50

# TODO: Migrate in-memory cache to Redis for production scalability.


class AnalysisCache:
    def __init__(self):
        # OrderedDict used as an LRU cache
        self._store: OrderedDict[str, Dict[str, Any]] = OrderedDict()

    def _key(self, ticker: str) -> str:
        return ticker.upper().strip()

    def get(self, ticker: str) -> Optional[Dict[str, Any]]:
        key = self._key(ticker)
        entry = self._store.get(key)
        if entry is None:
            return None
        if time.time() - entry["ts"] > CACHE_TTL_SECONDS:
            logger.info(f"Cache expired for {ticker}")
            del self._store[key]
            return None
        # Move to end (most recently used)
        self._store.move_to_end(key)
        logger.info(f"Cache hit for {ticker}", extra={"metadata": {"event": "cache_hit", "ticker": ticker}})
        return entry["data"]

    def set(self, ticker: str, data: Dict[str, Any]) -> None:
        key = self._key(ticker)
        if key in self._store:
            self._store.move_to_end(key)
        self._store[key] = {"data": data, "ts": time.time()}
        # Evict oldest if over size limit
        while len(self._store) > CACHE_MAX_SIZE:
            evicted, _ = self._store.popitem(last=False)
            logger.info(f"Cache evicted {evicted} (LRU)")
        logger.info(f"Cache stored for {ticker}", extra={"metadata": {"event": "cache_set", "ticker": ticker}})

    def invalidate(self, ticker: str) -> None:
        key = self._key(ticker)
        if key in self._store:
            del self._store[key]
            logger.info(f"Cache invalidated for {ticker}")

    def stats(self) -> Dict[str, Any]:
        now = time.time()
        return {
            "size": len(self._store),
            "max_size": CACHE_MAX_SIZE,
            "ttl_seconds": CACHE_TTL_SECONDS,
            "entries": [
                {
                    "ticker": k,
                    "age_seconds": round(now - v["ts"]),
                    "expires_in": max(0, round(CACHE_TTL_SECONDS - (now - v["ts"]))),
                }
                for k, v in self._store.items()
            ],
        }


analysis_cache = AnalysisCache()
