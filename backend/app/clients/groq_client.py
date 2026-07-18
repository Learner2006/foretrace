import httpx
from app.config.settings import settings
from app.utils.logger import logger
from typing import Dict, Any, List, Optional
import asyncio
import json
import re
from app.utils.circuit_breaker import CircuitBreaker

groq_circuit = CircuitBreaker("Groq API")


class GroqClient:
    def __init__(self):
        self.base_url = "https://api.groq.com/openai/v1"
        self.headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        }
        # Hardcoded fallbacks in case the dynamic fetch fails
        self.fallback_fast_models = [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768"
        ]
        self.fallback_reasoning_models = [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "deepseek-r1-distill-llama-70b"
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
            if tier == "reasoning":
                # Primary: Llama 3.3 70B
                llama3_3 = [m for m in available if "llama" in m.lower() and "3.3" in m.lower() and "70b" in m.lower()]
                # Fallback 1: Llama 3.1 70B
                llama3_1 = [m for m in available if "llama" in m.lower() and "3.1" in m.lower() and "70b" in m.lower()]
                # Fallback 2: DeepSeek R1
                deepseeks = [m for m in available if "deepseek-r1" in m.lower()]
                
                others = [m for m in available if m not in llama3_3 and m not in llama3_1 and m not in deepseeks]
                return llama3_3 + llama3_1 + deepseeks + others
            else: # fast
                # Prefer versatile/instant llama models
                llamas = [m for m in available if "llama" in m.lower() and ("8b" in m.lower() or "instant" in m.lower())]
                llamas_70b = [m for m in available if "llama" in m.lower() and "70b" in m.lower() and "versatile" in m.lower()]
                return llamas + llamas_70b + available
                
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

        async with httpx.AsyncClient() as client:
            for current_model in models_to_try:
                logger.info(f"Trying Groq model: {current_model}...", extra={"metadata": {"event": "ai_execution_start", "model": current_model}})
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

                    r = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=self.headers,
                        json=payload,
                        timeout=40.0,
                    )
                    
                    if r.status_code == 429:
                        logger.warning(f"Groq model {current_model} returned 429 Rate Limit. Trying next fallback...")
                        continue
                        
                    if r.status_code == 404:
                        logger.warning(f"Groq model {current_model} returned 404 (Deprecated/Removed). Seamlessly falling back...")
                        continue
                        
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
                    logger.warning(f"Groq model {current_model} failed: {e}. Trying next model...")
                    continue
            
            logger.error("All fallback models failed.", extra={"metadata": {"event": "ai_execution_all_failed"}})
            raise Exception("Failed to get completion from Groq API after exhausting all fallback models.")

groq_client = GroqClient()
