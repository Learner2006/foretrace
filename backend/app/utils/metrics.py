from prometheus_client import Counter, Histogram

# Cache Metrics
CACHE_HITS = Counter(
    "foretrace_cache_hits_total", 
    "Total number of cache hits in the in-memory AnalysisCache"
)
CACHE_MISSES = Counter(
    "foretrace_cache_misses_total", 
    "Total number of cache misses in the in-memory AnalysisCache"
)

# API & Pipeline Latency Metrics
API_LATENCY = Histogram(
    "foretrace_api_latency_seconds", 
    "Latency of external API calls in seconds",
    ["service"]  # e.g., 'sec_edgar', 'groq'
)

PIPELINE_LATENCY = Histogram(
    "foretrace_pipeline_latency_seconds", 
    "Overall latency of the LLM composition pipeline in seconds"
)

ERROR_COUNTER = Counter(
    "foretrace_errors_total",
    "Total number of errors encountered during request processing",
    ["type"]  # e.g., 'validation', 'api_timeout', 'internal'
)

# Application Level Metrics


SUCCESSFUL_ANALYSES = Counter(
    "foretrace_successful_analyses_total",
    "Total successful analyses"
)
FAILED_ANALYSES = Counter(
    "foretrace_failed_analyses_total",
    "Total failed analyses"
)

# Groq Telemetry
GROQ_REQUESTS = Counter(
    "foretrace_groq_requests_total",
    "Total requests to Groq",
    ["model"]
)
GROQ_FAILURES = Counter(
    "foretrace_groq_failures_total",
    "Total failures from Groq",
    ["model", "type"]
)
GROQ_429_COUNT = Counter(
    "foretrace_groq_429_total",
    "Total 429 Rate Limits hit on Groq"
)
CIRCUIT_BREAKER_OPENS = Counter(
    "foretrace_circuit_breaker_opens_total",
    "Total times the circuit breaker opened"
)
AVERAGE_ENGINE_LATENCY = Histogram(
    "foretrace_engine_latency_seconds",
    "Latency per analysis engine",
    ["engine"]
)
