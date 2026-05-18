import httpx
import json
import os
import re
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


# ─────────────────────────────────────────────
# STEP 0 — Local signal extraction (free, instant)
# No Groq call. Just pulls financial keywords from filing text
# so Call 3 has grounded constraints to reason from.
# ─────────────────────────────────────────────

def extract_financial_signals(filing_text: str) -> dict:
    text = filing_text.lower()

    signals = {
        "revenue_trend": None,
        "debt_posture": None,
        "expansion_signals": [],
        "margin_pressure": False,
        "layoffs_or_restructuring": False,
        "cash_position": None,
    }

    # Revenue trend
    if any(w in text for w in ["revenue declined", "revenue decreased", "revenue fell", "lower revenue"]):
        signals["revenue_trend"] = "declining"
    elif any(w in text for w in ["revenue increased", "revenue grew", "revenue growth", "higher revenue"]):
        signals["revenue_trend"] = "growing"
    else:
        signals["revenue_trend"] = "uncertain"

    # Debt posture
    if any(w in text for w in ["increased debt", "debt increased", "additional borrowings", "higher interest expense"]):
        signals["debt_posture"] = "increasing"
    elif any(w in text for w in ["repaid debt", "debt reduced", "deleveraging", "paid down"]):
        signals["debt_posture"] = "decreasing"
    else:
        signals["debt_posture"] = "stable"

    # Expansion signals
    for keyword in ["new markets", "international expansion", "acquired", "acquisition", "launched", "new product", "new segment"]:
        if keyword in text:
            signals["expansion_signals"].append(keyword)

    # Margin pressure
    if any(w in text for w in ["margin compression", "margins declined", "cost pressure", "inflationary", "higher costs"]):
        signals["margin_pressure"] = True

    # Restructuring / layoffs
    if any(w in text for w in ["restructuring", "workforce reduction", "layoffs", "headcount", "cost reduction program"]):
        signals["layoffs_or_restructuring"] = True

    # Cash position
    if any(w in text for w in ["strong cash", "cash and equivalents increased", "positive free cash flow"]):
        signals["cash_position"] = "strong"
    elif any(w in text for w in ["cash decreased", "cash burn", "negative free cash flow", "liquidity concerns"]):
        signals["cash_position"] = "weak"
    else:
        signals["cash_position"] = "unknown"

    return signals


# ─────────────────────────────────────────────
# HELPER — Single Groq call
# ─────────────────────────────────────────────

async def _groq_call(prompt: str, temperature: float = 0.3) -> str:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",  # dev mode — switch to llama-3.3-70b-versatile for prod
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
            },
            timeout=60.0,
        )
        data = r.json()

        if "choices" not in data:
            raise Exception(f"Groq error: {data}")

        raw = data["choices"][0]["message"]["content"]
        raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return raw


def _parse_json(raw: str):
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Handle both objects {} and arrays []
        match = re.search(r'(\{.*\}|\[.*\])', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise


# ─────────────────────────────────────────────
# CALL 1+2 MERGED — Behavior extraction + Analog reasoning
#
# Key trick: AI must NAME the behavioral pattern first,
# THEN find the analog company. This prevents defaulting
# to "Netflix 2011" without reasoning.
# ─────────────────────────────────────────────

async def call_behavior_and_analogs(company_name: str, filing_text: str, signals: dict) -> dict:
    signals_summary = f"""
- Revenue trend: {signals['revenue_trend']}
- Debt posture: {signals['debt_posture']}
- Cash position: {signals['cash_position']}
- Margin pressure: {signals['margin_pressure']}
- Restructuring activity: {signals['layoffs_or_restructuring']}
- Expansion signals: {', '.join(signals['expansion_signals']) if signals['expansion_signals'] else 'none detected'}
""".strip()

    prompt = f"""You are a company behavior research analyst. Find deep behavioral patterns.

Company: {company_name}
Financial signals: {signals_summary}

Filing:
{filing_text}

INSTRUCTIONS:
1. Identify the core behavioral pattern. Be specific and mechanistic — describe WHAT the company is doing AND why it creates tension.
   BAD (too generic): "Technology company facing competition"
   BAD (too vague): "Growth stage company"
   GOOD: "Margin-pressured platform scaling enterprise segment while consumer segment saturates"
   GOOD: "Over-leveraged retailer using debt-funded expansion as demand permanently shifts to digital"
   GOOD: "Profitable legacy business funding speculative adjacency bets with declining core revenue"
   The pattern name goes in "behavioral_pattern_identified" — it is used as a search key for analogs.
2. Using THAT SPECIFIC PATTERN (not the company name), find one historical success analog and one failure analog.
   Search across all industries, all decades. Be creative. Avoid defaults.
3. NEVER use Netflix, Kodak, Blockbuster, or Enron as analogs unless the behavioral pattern is literally identical AND you can cite specific filing language that matches.

Return ONLY valid JSON:

{{
  "behavioral_summary": {{
    "what_is_happening": "2-3 sentences based on filing evidence.",
    "why_it_matters": "1-2 sentences on what is at stake.",
    "key_forces": ["force 1", "force 2", "force 3"],
    "confidence": "High or Moderate or Low",
    "confidence_reason": "One sentence."
  }},
  "risk_signals": [
    {{"signal": "5 words max", "why_it_matters": "One specific sentence."}}
  ],
  "behavioral_pattern_identified": "Abstract pattern name — used internally.",
  "analogs": [
    {{
      "type": "success",
      "company": "Real company name",
      "analog_ticker": "TICKER or null",
      "year": 2018,
      "similarity_score": 78,
      "what_they_resembled": "Why this matches the behavioral pattern.",
      "action_taken": "What they did.",
      "outcome": "What happened — with % or $ numbers.",
      "key_difference": "One thing that made them succeed that {company_name} may lack.",
      "citation": "Source"
    }},
    {{
      "type": "failure",
      "company": "Real company name",
      "analog_ticker": "TICKER or null",
      "year": 2017,
      "similarity_score": 65,
      "what_they_resembled": "Why this matches the behavioral pattern.",
      "action_taken": "What they did wrong.",
      "outcome": "What happened — with % or $ numbers.",
      "key_difference": "One thing that caused failure to watch for.",
      "citation": "Source"
    }}
  ],
  "relationship_context": {{
    "linked_to": ["Key company/entity influencing trajectory"],
    "insight": "One sentence."
  }},
  "chart_data": [
    {{"name": "{company_name}", "metric": 0, "label": "Current (baseline)"}},
    {{"name": "Success analog name", "metric": 25, "label": "Outcome change %"}},
    {{"name": "Failure analog name", "metric": -38, "label": "Outcome change %"}}
  ]
}}"""

    raw = await _groq_call(prompt, temperature=0.3)
    return _parse_json(raw)


# ─────────────────────────────────────────────
# CALL 3 — Divergence + Mitigation Levers
#
# This is the most original call.
# Input: what we already know (behavior + analogs + signals)
# Output: what THIS specific company should actually do
#
# Temperature slightly higher — we want original thinking here.
# ─────────────────────────────────────────────

async def call_mitigation_levers(company_name: str, merged_output: dict, signals: dict) -> list:
    behavioral_pattern = merged_output.get("behavioral_pattern_identified", "unknown pattern")
    analogs = merged_output.get("analogs", [])

    success_analog = next((a for a in analogs if a["type"] == "success"), {})
    failure_analog = next((a for a in analogs if a["type"] == "failure"), {})

    signals_summary = f"""
- Revenue trend: {signals['revenue_trend']}
- Debt posture: {signals['debt_posture']}
- Cash position: {signals['cash_position']}
- Margin pressure: {signals['margin_pressure']}
- Restructuring activity: {signals['layoffs_or_restructuring']}
""".strip()

    prompt = f"""Company behavior analyst. You analyzed {company_name}.

Pattern: {behavioral_pattern}
Success: {success_analog.get('company','N/A')} ({success_analog.get('year','')}) — did: {success_analog.get('action_taken','')} — outcome: {success_analog.get('outcome','')}
Failure: {failure_analog.get('company','N/A')} ({failure_analog.get('year','')}) — did: {failure_analog.get('action_taken','')} — outcome: {failure_analog.get('outcome','')}
Constraints: {signals_summary}

Given these analogs and {company_name}'s actual financial constraints, what are 2-3 concrete levers they can pull?
Be specific. Respect constraints — weak cash means no acquisitions, high debt means no expansion.

Return ONLY valid JSON array:

[
  {{
    "lever": "5 words max",
    "rationale": "Why this company specifically can do this.",
    "analog_basis": "Which analog and how.",
    "risk_if_ignored": "One sentence consequence."
  }}
]"""

    raw = await _groq_call(prompt, temperature=0.4)
    return _parse_json(raw)


# ─────────────────────────────────────────────
# CONFIDENCE SCORER — Deterministic, signal-based
#
# AI-generated confidence is unreliable — it hallucinates
# "High" even under financial stress. This overrides it.
#
# Logic:
#   0 red flags  → High   (clean filing, no stress)
#   1-2 red flags → Moderate (some signals, pattern may be partial)
#   3+  red flags → Low    (active pressure distorts behavioral read)
# ─────────────────────────────────────────────

def _compute_confidence(signals: dict) -> tuple[str, str]:
    red_count = sum([
        signals.get("revenue_trend") == "declining",
        signals.get("debt_posture") == "increasing",
        signals.get("cash_position") == "weak",
        signals.get("margin_pressure") == True,
        signals.get("layoffs_or_restructuring") == True,
    ])
    if red_count == 0:
        return "High", "Filing shows stable financials with no major stress signals detected."
    if red_count <= 2:
        return "Moderate", f"{red_count} structural stress signal(s) detected — pattern analysis may be partially obscured."
    return "Low", f"{red_count} structural stress signals detected — behavioral pattern may be distorted by active financial pressure."


# ─────────────────────────────────────────────
# MAIN ENTRY POINT
# ─────────────────────────────────────────────

async def analyze_company(company_name: str, filing_text: str) -> dict:
    # Step 0 — Free, instant, local
    signals = extract_financial_signals(filing_text)

    # Call 1+2 — Behavior + Analogs (~15-18s)
    merged = await call_behavior_and_analogs(company_name, filing_text, signals)

    # Call 3 — Mitigation Levers (~10-12s)
    try:
        levers = await call_mitigation_levers(company_name, merged, signals)
    except Exception:
        levers = []

    # P1 — Deterministic confidence override
    # AI-generated confidence is unreliable under financial stress.
    # Recompute from signals and inject, discarding AI value.
    confidence_level, confidence_reason = _compute_confidence(signals)
    behavioral_summary = merged.get("behavioral_summary", {})
    behavioral_summary["confidence"] = confidence_level
    behavioral_summary["confidence_reason"] = confidence_reason

    # Assemble final response
    result = {
        "company": company_name,
        "behavioral_summary": behavioral_summary,
        "risk_signals": merged.get("risk_signals", []),
        "analogs": merged.get("analogs", []),
        "mitigation_levers": levers,
        "relationship_context": merged.get("relationship_context", {}),
        "chart_data": merged.get("chart_data", []),
    }

    return result