import asyncio, json, logging, os, random, re
from typing import Any, Dict, List, Optional, Tuple
import httpx
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError, field_validator

load_dotenv()

# TODO: Move this to a proper config file later, env vars are getting messy
logger = logging.getLogger("foretrace.ai_analyzer")
if not logger.handlers:
    logger.addHandler(logging.StreamHandler())
    # FIXME: Hardcoded INFO level for now, should probably be DEBUG in dev
    logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# free-tier fallback chain. 
# NOTE: Groq changes these models constantly. If this breaks, check their docs.
FREE_TIER_MODELS = [m.strip() for m in os.getenv(
    "GROQ_FALLBACK_MODELS", "llama-3.3-70b-versatile,qwen-2.5-32b,gemma2-9b-it"
).split(",") if m.strip()]

# These timeouts feel a bit aggressive but we don't want to hang forever
GROQ_REQUEST_TIMEOUT = float(os.getenv("GROQ_REQUEST_TIMEOUT", "30.0"))
GROQ_MAX_TOKENS = int(os.getenv("GROQ_MAX_TOKENS", "2000"))
FILING_EXCERPT_CHAR_LIMIT = int(os.getenv("FILING_EXCERPT_CHAR_LIMIT", "3000"))

# Retry logic - might need tweaking if we hit rate limits often
GROQ_MAX_RETRIES_PER_MODEL = int(os.getenv("GROQ_MAX_RETRIES_PER_MODEL", "3"))
GROQ_BACKOFF_BASE_SECONDS = float(os.getenv("GROQ_BACKOFF_BASE_SECONDS", "1.0"))
GROQ_BACKOFF_MAX_SECONDS = float(os.getenv("GROQ_BACKOFF_MAX_SECONDS", "20.0"))

RETRYABLE_STATUS = {429, 500, 502, 503, 504}

# DISCLAIMER: We are NOT using a vector DB yet. This is pure LLM hallucination risk.
# Treat analogs as creative writing until we add RAG.
ANALOG_DISCLAIMER = (
    "Historical analogs are generated from the model's training data, not "
    "retrieved from a verified dataset. Company names, dates, and figures "
    "may be inaccurate or fabricated. Treat as an illustrative pattern "
    "comparison, not a verified historical record."
)

# Stuff the model echoes back when it's lazy or doesn't fill the schema properly
# TODO: Add more variations of placeholder text here as we find them
PLACEHOLDER_NAMES = {
    "real company name", "n/a", "unknown", "company name", "", "none",
    "<actual real public company name, not a placeholder>",
    "actual real public company name, not a placeholder",
}


class ConfigurationError(RuntimeError):
    pass


class UpstreamModelError(RuntimeError):
    pass


def _require_api_key() -> str:
    if not GROQ_API_KEY:
        raise ConfigurationError("GROQ_API_KEY is missing from environment variables.")
    return GROQ_API_KEY


def extract_financial_signals(filing_text: str) -> Dict[str, Any]:
    """
    keyword-based extraction. 
    WARNING: This is naive. It fails on negations (e.g., "did not decline"). 
    Good enough for MVP, but needs NLP upgrade later.
    """
    text = filing_text.lower()
    signals: Dict[str, Any] = {}

    def pick(options, default):
        for value, keywords in options:
            if any(kw in text for kw in keywords):
                return value
        return default

    signals["revenue_trend"] = pick([
        ("declining", ["revenue declined", "revenue decreased", "revenue fell", "lower revenue"]),
        ("growing", ["revenue increased", "revenue grew", "revenue growth", "higher revenue"]),
    ], "uncertain")

    signals["debt_posture"] = pick([
        ("increasing", ["increased debt", "debt increased", "additional borrowings", "higher interest expense"]),
        ("decreasing", ["repaid debt", "debt reduced", "deleveraging", "paid down"]),
    ], "stable")

    signals["cash_position"] = pick([
        ("strong", ["strong cash", "cash and equivalents increased", "positive free cash flow"]),
        ("weak", ["cash decreased", "cash burn", "negative free cash flow", "liquidity concerns"]),
    ], "unknown")

    signals["expansion_signals"] = [kw for kw in (
        "new markets", "international expansion", "acquired", "acquisition",
        "launched", "new product", "new segment",
    ) if kw in text]

    signals["margin_pressure"] = any(p in text for p in
        ["margin compression", "margins declined", "cost pressure", "inflationary", "higher costs"])

    signals["layoffs_or_restructuring"] = any(p in text for p in
        ["restructuring", "workforce reduction", "layoffs", "headcount", "cost reduction program"])
    
    return signals


# Basic injection protection. Probably easy to bypass with unicode tricks.
_INJECTION_MARKERS = re.compile(
    r"(ignore (all )?previous instructions|system prompt|you are now|"
    r"disregard the above|act as (a|an)\s|new instructions:)", re.IGNORECASE)


def _sanitize_filing_excerpt(text: str, limit: int) -> str:
    excerpt = text[:limit]
    if _INJECTION_MARKERS.search(excerpt):
        logger.warning("filing excerpt tripped the injection heuristic, stripping it")
        excerpt = _INJECTION_MARKERS.sub("[redacted]", excerpt)
    return excerpt


def _clean_json_response(raw: str) -> str:
    # This regex is fragile. If the LLM puts JSON inside a string value, this breaks.
    cleaned = re.sub(r'```json\s*|\s*```', '', raw)
    start = max(cleaned.find('{'), cleaned.find('['))
    end = max(cleaned.rfind('}'), cleaned.rfind(']')) + 1
    
    if start == -1 or end == 0:
        raise ValueError(f"No valid JSON structure found in response: {raw[:100]}...")
    
    return cleaned[start:end]


def _parse_json(raw: str) -> Any:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        try:
            return json.loads(_clean_json_response(raw))
        except Exception as e:
            # TODO: Log the full raw response here for debugging instead of just raising
            raise ValueError(f"Failed to parse JSON after cleaning. Error: {e}") from e


def _compute_backoff_seconds(attempt: int, retry_after_header: Optional[str]) -> float:
    if retry_after_header:
        try:
            return min(float(retry_after_header), GROQ_BACKOFF_MAX_SECONDS)
        except ValueError:
            pass  # sometimes it's an HTTP date, not worth parsing that right now
    
    # Jitter is important to prevent thundering herd if we scale this up
    return random.uniform(0, min(GROQ_BACKOFF_BASE_SECONDS * (2 ** attempt), GROQ_BACKOFF_MAX_SECONDS))


async def _call_single_model(client, api_key, model, prompt, temperature) -> Tuple[Optional[str], Optional[str], bool]:
    last_error = None

    for attempt in range(GROQ_MAX_RETRIES_PER_MODEL + 1):
        try:
            r = await client.post(
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": temperature,
                    "max_tokens": GROQ_MAX_TOKENS,
                },
            )

            if r.status_code == 200:
                choices = r.json().get("choices") or []
                if choices:
                    content = choices[0].get("message", {}).get("content")
                    
                    # Handle truncation explicitly
                    if choices[0].get("finish_reason") == "length":
                        last_error = f"{model}: response truncated by max_tokens"
                        logger.warning(
                            "Model %s truncated by max_tokens (attempt %d/%d) - retrying rather than returning broken JSON.",
                            model, attempt + 1, GROQ_MAX_RETRIES_PER_MODEL,
                        )
                        if attempt < GROQ_MAX_RETRIES_PER_MODEL:
                            await asyncio.sleep(_compute_backoff_seconds(attempt, None))
                            continue
                        return None, last_error, True
                    
                    if content:
                        return content.strip(), None, False
                
                return None, f"{model}: empty choices", True

            if r.status_code in RETRYABLE_STATUS:
                last_error = f"{model}: HTTP {r.status_code}"
                if attempt < GROQ_MAX_RETRIES_PER_MODEL:
                    await asyncio.sleep(_compute_backoff_seconds(attempt, r.headers.get("Retry-After")))
                    continue
                return None, last_error, True

            logger.warning("HTTP %d from %s, not retrying: %s", r.status_code, model, r.text[:200])
            return None, f"{model}: HTTP {r.status_code}", True

        except httpx.TimeoutException:
            last_error = f"{model}: timeout"
            if attempt < GROQ_MAX_RETRIES_PER_MODEL:
                await asyncio.sleep(_compute_backoff_seconds(attempt, None))
                continue
            return None, last_error, True
        except httpx.RequestError as e:
            return None, f"{model}: {e}", True
        except (KeyError, ValueError, json.JSONDecodeError) as e:
            return None, f"{model}: malformed response ({e})", True

    return None, last_error, True


async def _groq_call(prompt: str, temperature: float = 0.3) -> str:
    api_key = _require_api_key()
    last_error = None
    
    # TODO: Reuse client instance across calls for better performance?
    async with httpx.AsyncClient(timeout=GROQ_REQUEST_TIMEOUT) as client:
        for model in FREE_TIER_MODELS:
            content, error, _ = await _call_single_model(client, api_key, model, prompt, temperature)
            if content is not None:
                return content
            last_error = error

    raise UpstreamModelError(f"All Groq fallback models failed. Last error: {last_error}")


class BehavioralSummary(BaseModel):
    what_is_happening: str = ""
    why_it_matters: str = ""
    key_forces: List[str] = Field(default_factory=list)
    confidence: str = "Low"
    confidence_reason: str = ""


class RiskSignal(BaseModel):
    signal: str = ""
    why_it_matters: str = ""


class Analog(BaseModel):
    type: str
    company: str = "Unknown"
    year: Optional[int] = None
    similarity_score: Optional[int] = None
    what_they_resembled: str = ""
    action_taken: str = ""
    outcome: str = ""
    key_difference: str = ""
    similarity_basis: List[str] = Field(default_factory=list)
    disclaimer: str = ANALOG_DISCLAIMER

    @field_validator("type")
    @classmethod
    def type_must_be_valid(cls, v):
        if v not in ("success", "failure"):
            raise ValueError(f"analog type must be 'success' or 'failure', got {v!r}")
        return v

    @property
    def is_placeholder_junk(self) -> bool:
        return self.company.strip().lower() in PLACEHOLDER_NAMES


class MarketPosition(BaseModel):
    sector_standing: str = ""
    key_dependency: str = ""
    momentum: str = "stable"


class BehaviorAndAnalogsResponse(BaseModel):
    behavioral_summary: BehavioralSummary = Field(default_factory=BehavioralSummary)
    risk_signals: List[RiskSignal] = Field(default_factory=list)
    behavioral_pattern_identified: str = ""
    analogs: List[Analog] = Field(default_factory=list)
    market_position: Optional[MarketPosition] = None


class MitigationLever(BaseModel):
    lever: str = ""
    rationale: str = ""
    analog_basis: str = ""
    risk_if_ignored: str = ""


async def call_behavior_and_analogs(company_name: str, filing_text: str, signals: Dict) -> BehaviorAndAnalogsResponse:
    signals_summary = (
        f"- Revenue trend: {signals['revenue_trend']}\n"
        f"- Debt posture: {signals['debt_posture']}\n"
        f"- Cash position: {signals['cash_position']}\n"
        f"- Margin pressure: {signals['margin_pressure']}\n"
        f"- Restructuring activity: {signals['layoffs_or_restructuring']}\n"
        f"- Expansion signals: {', '.join(signals['expansion_signals']) or 'none detected'}"
    )
    
    safe_excerpt = _sanitize_filing_excerpt(filing_text, FILING_EXCERPT_CHAR_LIMIT)

    # The prompt is huge. Might need to truncate filing_text more aggressively if we hit context limits
    prompt = f"""You are a senior company behavior research analyst.

    Company: {company_name}
    Financial Signals: {signals_summary}

    Filing Excerpt:
    {safe_excerpt}

    INSTRUCTIONS:
    1. Identify the core BEHAVIORAL PATTERN. Be mechanistic (e.g., "Margin-pressured platform scaling enterprise while consumer saturates").
    2. Find ONE historical SUCCESS analog and ONE FAILURE analog based ONLY on this pattern. Avoid clichés unless exact match.
    3. similarity_basis MUST cite at least 2 signals from the extracted signal set.
    4. ONLY use real, publicly traded companies and events you are highly confident actually happened and are widely documented
       (e.g. well-known earnings events, bankruptcies, turnarounds covered in mainstream financial press). Do NOT invent a
       company, event, or outcome. If you are not confident a specific real analog exists, set "similarity_score" below 40
       and state the uncertainty explicitly in "key_difference" rather than fabricating specifics.
    5. Do NOT invent precise financial figures (%, $) you are not confident about - describe the outcome directionally
       instead (e.g., "stock declined sharply over the following year") if you don't know the exact number.
    6. Return ONLY valid JSON. No markdown, no explanations outside JSON.

    JSON Structure:
    {{
      "behavioral_summary": {{
        "what_is_happening": "2-3 sentences based on filing evidence.",
        "why_it_matters": "1-2 sentences on stake.",
        "key_forces": ["force 1", "force 2"],
        "confidence": "High/Moderate/Low",
        "confidence_reason": "One sentence."
      }},
      "risk_signals": [
        {{"signal": "5 words max", "why_it_matters": "One specific sentence."}}
      ],
      "behavioral_pattern_identified": "Abstract pattern name",
      "analogs": [
        {{
          "type": "success",
          "company": "<actual real public company name, not a placeholder>",
          "year": 2018,
          "similarity_score": 78,
          "what_they_resembled": "Why this matches.",
          "action_taken": "What they did.",
          "outcome": "Result with % or $ numbers only if you are confident of the figure, otherwise a qualitative description.",
          "key_difference": "One thing they had that {company_name} may lack.",
          "similarity_basis": ["signal_name: value — explanation", "signal_name: value — explanation"]
        }},
        {{
          "type": "failure",
          "company": "<actual real public company name, not a placeholder>",
          "year": 2017,
          "similarity_score": 65,
          "what_they_resembled": "Why this matches.",
          "action_taken": "What they did wrong.",
          "outcome": "Result with % or $ numbers only if you are confident of the figure, otherwise a qualitative description.",
          "key_difference": "One thing that caused failure.",
          "similarity_basis": ["signal_name: value — explanation", "signal_name: value — explanation"]
        }}
      ],
      "market_position": {{
        "sector_standing": "One sentence on market share/tier.",
        "key_dependency": "One sentence on biggest external dependency.",
        "momentum": "growing/stable/declining"
      }}
    }}
    """

    parsed = _parse_json(await _groq_call(prompt, temperature=0.3))
    try:
        response = BehaviorAndAnalogsResponse.model_validate(parsed)
    except ValidationError as e:
        logger.error("LLM response failed schema validation: %s", e)
        raise

    # drop analogs where the model just echoed the schema's placeholder company name
    response.analogs = [a for a in response.analogs if not a.is_placeholder_junk]
    return response


async def call_mitigation_levers(company_name: str, response: BehaviorAndAnalogsResponse, signals: Dict) -> List[MitigationLever]:
    pattern = response.behavioral_pattern_identified or "unknown pattern"
    success = next((a for a in response.analogs if a.type == "success"), None)
    failure = next((a for a in response.analogs if a.type == "failure"), None)

    signals_summary = (
        f"- Revenue trend: {signals['revenue_trend']}\n"
        f"- Debt posture: {signals['debt_posture']}\n"
        f"- Cash position: {signals['cash_position']}\n"
        f"- Margin pressure: {signals['margin_pressure']}"
    )

    prompt = f"""Company Behavior Analyst.

    Pattern: {pattern}
    Success Analog: {success.company if success else 'N/A'} — Action: {success.action_taken if success else ''}
    Failure Analog: {failure.company if failure else 'N/A'} — Action: {failure.action_taken if failure else ''}
    Constraints: {signals_summary}

    Task: Propose 2-3 concrete levers {company_name} can pull.
    Respect constraints (e.g., weak cash = no acquisitions).

    Return ONLY valid JSON array:
    [
      {{"lever": "5 words max", "rationale": "Why this company specifically can do this.",
        "analog_basis": "Which analog inspired this.", "risk_if_ignored": "One sentence consequence."}}
    ]
    """

    parsed = _parse_json(await _groq_call(prompt, temperature=0.4))
    if not isinstance(parsed, list):
        raise ValueError(f"Expected a JSON array of levers, got {type(parsed).__name__}")

    levers = []
    for item in parsed:
        try:
            levers.append(MitigationLever.model_validate(item))
        except ValidationError as e:
            logger.warning("dropping a malformed lever: %s", e)
    return levers


def _compute_confidence(signals: Dict) -> Tuple[str, str]:
    red = sum([
        signals.get("revenue_trend") == "declining",
        signals.get("debt_posture") == "increasing",
        signals.get("cash_position") == "weak",
        signals.get("margin_pressure") is True,
        signals.get("layoffs_or_restructuring") is True,
    ])
    if red == 0:
        return "High", "Filing shows stable financials with no major stress signals."
    if red <= 2:
        return "Moderate", f"{red} structural stress signal(s) detected."
    return "Low", f"{red} structural stress signals detected — high distress probability."


def _compute_structural_risk(signals: Dict) -> Dict:
    # (condition, points to deduct, label shown on the frontend)
    penalties = [
        (signals.get("revenue_trend") == "declining", 25, "Revenue Declining"),
        (signals.get("debt_posture") == "increasing", 20, "Debt Load Growing"),
        (signals.get("cash_position") == "weak", 25, "Weak Cash Position"),
        (signals.get("margin_pressure") is True, 15, "Margin Pressure"),
        (signals.get("layoffs_or_restructuring") is True, 15, "Active Restructuring"),
    ]
    active = [label for hit, _, label in penalties if hit]
    score = max(0, 100 - sum(pts for hit, pts, _ in penalties if hit))

    if score >= 70:
        zone, reason = "Safe Zone", "No major structural distress signals."
    elif score >= 40:
        zone, reason = "Grey Zone", "Some structural stress — monitor closely."
    else:
        zone, reason = "Distress Zone", "Multiple distress signals active."

    return {"zone": zone, "score": score, "reason": reason, "active_factors": active}


async def analyze_company(company_name: str, filing_text: str) -> Dict:
    _require_api_key()
    signals = extract_financial_signals(filing_text)

    behavior_response = None
    try:
        behavior_response = await call_behavior_and_analogs(company_name, filing_text, signals)
    except (UpstreamModelError, ValueError, ValidationError) as e:
        logger.error("behavioral analysis failed for %s: %s", company_name, e)

    levers: List[MitigationLever] = []
    if behavior_response is not None:
        try:
            levers = await call_mitigation_levers(company_name, behavior_response, signals)
        except (UpstreamModelError, ValueError, ValidationError) as e:
            logger.warning("mitigation levers failed for %s: %s", company_name, e)

    confidence_level, confidence_reason = _compute_confidence(signals)
    structural_risk = _compute_structural_risk(signals)

    behavioral_summary = (
        behavior_response.behavioral_summary.model_dump() if behavior_response else BehavioralSummary().model_dump()
    )
    # deterministic score always wins over whatever the model self-reported
    behavioral_summary["confidence"] = confidence_level
    behavioral_summary["confidence_reason"] = confidence_reason

    return {
        "company": company_name,
        "behavioral_summary": behavioral_summary,
        "behavioral_pattern_identified": behavior_response.behavioral_pattern_identified if behavior_response else "",
        "risk_signals": [r.model_dump() for r in behavior_response.risk_signals] if behavior_response else [],
        "analogs": [a.model_dump() for a in behavior_response.analogs] if behavior_response else [],
        "mitigation_levers": [lv.model_dump() for lv in levers],
        "market_position": (
            behavior_response.market_position.model_dump()
            if behavior_response and behavior_response.market_position else None
        ),
        "structural_risk": structural_risk,
        "extracted_signals": signals,
        "analysis_degraded": behavior_response is None,
    }