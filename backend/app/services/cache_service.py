"""
In-memory analysis result cache for ForeTrace.
Caches completed analysis results per ticker so that repeated lookups
(e.g., CompanyPage + ComparePage for the same ticker) reuse the same run.

TTL: 24 hours — SEC filings don't change intraday.
Max size: 1000 tickers.
"""
import time
from collections import OrderedDict
from typing import Optional, Dict, Any
from app.utils.logger import logger

CACHE_TTL_SECONDS = 86400  # 24 hours
CACHE_MAX_SIZE = 1000


class AnalysisCache:
    def __init__(self):
        # OrderedDict used as an LRU cache
        self._store: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self.hits = 0
        self.misses = 0

    def _key(self, ticker: str) -> str:
        return ticker.upper().strip()

    def get(self, ticker: str) -> Optional[Dict[str, Any]]:
        key = self._key(ticker)
        entry = self._store.get(key)
        if entry is None:
            self.misses += 1
            logger.info(f"Cache miss for {ticker}", extra={"metadata": {"event": "cache_miss", "ticker": ticker}})
            return None
        if time.time() - entry["ts"] > CACHE_TTL_SECONDS:
            self.misses += 1
            logger.info(f"Cache expired for {ticker}")
            del self._store[key]
            return None
        self.hits += 1
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
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests) if total_requests > 0 else 0.0
        miss_rate = (self.misses / total_requests) if total_requests > 0 else 0.0

        logger.info(
            f"Cache stats accessed. Size: {len(self._store)}, Hits: {self.hits}, Misses: {self.misses}, Hit Rate: {hit_rate:.2%}",
            extra={"metadata": {"event": "cache_stats", "size": len(self._store), "hits": self.hits, "misses": self.misses, "hit_rate": hit_rate}}
        )

        return {
            "size": len(self._store),
            "max_size": CACHE_MAX_SIZE,
            "ttl_seconds": CACHE_TTL_SECONDS,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": hit_rate,
            "miss_rate": miss_rate,
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
