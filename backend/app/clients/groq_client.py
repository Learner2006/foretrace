import httpx
from app.config.settings import settings
from app.utils.logger import logger
from typing import Dict, Any, List
import asyncio
import time
import json
import re
from app.utils.circuit_breaker import CircuitBreaker

groq_circuit = CircuitBreaker("Groq API", failure_threshold=20, recovery_time=5.0)


class TokenRateLimiter:
    def __init__(self, max_tpm: int = 14000, max_rpm: int = 20):
        self.max_tpm = max_tpm
        self.max_rpm = max_rpm
        self.requests = []  # List of tuples (timestamp, token_count)

    async def acquire(self, estimated_tokens: int):
        import time
        while True:
            now = time.time()
            # Clean window: keep requests from the last 60 seconds
            self.requests = [r for r in self.requests if now - r[0] < 60.0]
            
            current_tokens = sum(r[1] for r in self.requests)
            current_rpm = len(self.requests)
            
            # Monitoring
            if current_rpm >= self.max_rpm * 0.8 or current_tokens >= self.max_tpm * 0.8:
                logger.warning(f"Groq Rate Limits Approaching: {current_rpm}/{self.max_rpm} RPM, {current_tokens}/{self.max_tpm} TPM.")
                
            if current_tokens + estimated_tokens > self.max_tpm or current_rpm >= self.max_rpm:
                sleep_dur = 1.0
                if self.requests:
                    sleep_dur = max(0.5, 60.0 - (now - self.requests[0][0]))
                    sleep_dur = min(3.0, sleep_dur)
                logger.warning(
                    f"Proactive Rate Limiting: window at {current_tokens} tokens / {current_rpm} RPM. "
                    f"Acquiring {estimated_tokens} tokens. Delaying execution by {sleep_dur:.2f}s..."
                )
                await asyncio.sleep(sleep_dur)
            else:
                self.requests.append((now, estimated_tokens))
                break


class GroqClient:
    def __init__(self):
        self.base_url = "https://api.groq.com/openai/v1"
        self.headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        }
        self.rate_limiter = TokenRateLimiter(max_tpm=14000, max_rpm=20)
        # Active Groq models fallbacks in case dynamic fetch fails
        self.fallback_fast_models = [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "gemma2-9b-it",
            "llama-3.2-3b-preview",
        ]
        self.fallback_reasoning_models = [
            "llama-3.3-70b-versatile",
            "deepseek-r1-distill-llama-70b",
            "qwen-2.5-32b",
            "llama-3.1-8b-instant",
        ]
        self._cached_models = []

    async def _get_available_models(self) -> List[str]:
        if self._cached_models:
            return self._cached_models
        
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(
                    f"{self.base_url}/models",
                    headers=self.headers,
                    timeout=10.0
                )
                r.raise_for_status()
                data = r.json()
                models = [m["id"] for m in data.get("data", [])]
                self._cached_models = models
                return models
        except Exception as e:
            logger.warning(f"Failed to fetch dynamic models from Groq: {e}. Using hardcoded fallbacks.")
            return []

    async def _resolve_models_for_tier(self, tier: str) -> List[str]:
        # Fetch available models dynamically to avoid 404s on deprecation.
        available = await self._get_available_models()
        
        # If API returns models, dynamically build the best list
        if available:
            # Filter out non-chat/audio models
            text_models = [
                m for m in available 
                if not any(x in m.lower() for x in ["whisper", "orpheus", "tts", "stt", "audio"])
            ]
            
            if tier == "reasoning":
                # Prioritize large/reasoning models (70b+, 120b+, deepseek, gpt-oss, qwen)
                large_models = [
                    m for m in text_models 
                    if any(k in m.lower() for k in ["70b", "120b", "90b", "deepseek", "gpt", "qwen", "reasoning"])
                ]
                return large_models if large_models else text_models
            else:  # fast tier
                # Prioritize fast/instant models (8b, 3b, 1b, 17b, 20b, instant, scout, gemma, versatile)
                fast_models = [
                    m for m in text_models 
                    if any(k in m.lower() for k in ["8b", "3b", "1b", "17b", "20b", "instant", "scout", "gemma", "versatile", "fast"])
                ]
                return fast_models if fast_models else text_models
                
        # If dynamic fetch failed, use hardcoded lists
        return self.fallback_reasoning_models if tier == "reasoning" else self.fallback_fast_models

    @groq_circuit
    async def chat_completion_json(self, prompt: str, system_message: str = "Return only valid JSON.", model: str = None, tier: str = "fast", temperature: float = 0.3) -> Dict[str, Any]:
        """
        Executes a chat completion enforcing JSON mode.
        If a specific 'model' is passed and it fails (e.g. deprecated), it will seamlessly fallback 
        to other models in the requested 'tier' ("fast" or "reasoning").
        """
        # Centralized JSON extraction to avoid repetition across engines.
        models_to_try = await self._resolve_models_for_tier(tier)
        
        # If a specific model was requested, put it at the front of the list
        if model and model not in models_to_try:
            models_to_try.insert(0, model)
        elif model and model in models_to_try:
            models_to_try.remove(model)
            models_to_try.insert(0, model)
            
        # De-duplicate while preserving order
        seen = set()
        models_to_try = [x for x in models_to_try if not (x in seen or seen.add(x))]

        # Estimate token usage and proactively acquire window slots to prevent 429
        estimated_tokens = len(system_message + prompt) // 4
        await self.rate_limiter.acquire(estimated_tokens)

        async with httpx.AsyncClient() as client:
            for current_model in models_to_try:
                logger.info(f"Trying Groq model: {current_model}...", extra={"metadata": {"event": "ai_execution_start", "model": current_model}})
                
                for attempt in range(3):
                    from app.utils.metrics import GROQ_REQUESTS
                    GROQ_REQUESTS.labels(model=current_model).inc()
                    try:
                        payload = {
                            "model": current_model,
                            "messages": [
                                {"role": "system", "content": system_message},
                                {"role": "user", "content": prompt}
                            ],
                            "temperature": temperature,
                            "response_format": {"type": "json_object"}
                        }
                        from app.utils.metrics import API_LATENCY

                        start = time.perf_counter()
                        r = await client.post(
                            f"{self.base_url}/chat/completions",
                            headers=self.headers,
                            json=payload,
                            timeout=40.0,
                        )
                        API_LATENCY.labels(service="groq").observe(time.perf_counter() - start)
                        
                        if r.status_code == 429:
                            from app.utils.metrics import GROQ_429_COUNT
                            GROQ_429_COUNT.inc()
                            if attempt < 2:
                                import random
                                sleep_time = (2 ** attempt) + random.uniform(0.1, 1.0)
                                logger.warning(f"Groq model {current_model} returned 429 Rate Limit (Attempt {attempt+1}/3). Retrying in {sleep_time:.2f}s...")
                                await asyncio.sleep(sleep_time)
                                continue
                            else:
                                from app.utils.metrics import GROQ_FAILURES
                                GROQ_FAILURES.labels(model=current_model, type="429").inc()
                                break
                            
                        if r.status_code >= 400:
                            from app.utils.metrics import GROQ_FAILURES
                            GROQ_FAILURES.labels(model=current_model, type=str(r.status_code)).inc()
                            logger.error(f"Groq API Error ({r.status_code}): {r.text}")
                            if r.status_code == 404:
                                logger.warning(f"Groq model {current_model} returned 404 (Deprecated/Removed). Seamlessly falling back...")
                            break
                            
                        r.raise_for_status()
                        data = r.json()
                        if "choices" in data:
                            raw = data["choices"][0]["message"]["content"]
                            logger.info(f"Groq API success with: {current_model}")
                            try:
                                return json.loads(raw)
                            except json.JSONDecodeError:
                                match = re.search(r'(\{.*\})', raw, re.DOTALL)
                                if match:
                                    return json.loads(match.group(1))
                                else:
                                    raise ValueError("Could not parse JSON from LLM response.")
                        
                    except Exception as e:
                        from app.utils.metrics import GROQ_FAILURES
                        GROQ_FAILURES.labels(model=current_model, type="exception").inc()
                        logger.error(f"Groq Request Exception on {current_model}: {str(e)}")
                        if attempt == 2:
                            logger.warning(f"Groq model {current_model} failed after retries: {e}. Trying next model...")
                        else:
                            await asyncio.sleep(1.0)
                            continue
                    continue
            
            logger.error("All fallback models failed.", extra={"metadata": {"event": "ai_execution_all_failed"}})
            raise Exception("Failed to get completion from Groq API after exhausting all fallback models.")

groq_client = GroqClient()
