from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Any
from enum import Enum
import re
import hashlib

# block verbatim prompt copies (hallucination detection)
PLACEHOLDERS = [
    "Structural Shift: [Detailed explanation of the core structural shift under way]. Evidence: [Direct quote or specific citation from the 10-K].",
    "Why It Matters: [Explanation of structural consequences]. Future Implication: [Long-term projection of what this shift leads to].",
    "Direct quote or specific citation from the 10-K.",
    "Specific business impact and strategic tension.",
    "Long-term effect on business model.",
    "What specific data point/event would prove this signal wrong.",
    "Why it matters: [Why it matters]. Probability: [High/Medium/Low]. Potential business impact: [Impact details]. Supporting evidence: [Evidence]. Possible mitigation: [Mitigation details].",
    "Filing quote explaining competitive moat strength.",
    "Filing quote justifying business trajectory.",
    "Filing quote justifying ranking relative to competitors.",
    " moats and sector standing (Competitive Moat details).",
    "Filing details on pricing power source or customer choices.",
    "Business/trajection impact.",
    "What threatens it / what could weaken the moat.",
    "Future Implication: Long-term projection of what this shift leads to.",
    "Mitigation: Management preparation/mitigation details from filing.",
    "Possible Invalidation: What specific data point/event would prove this signal wrong.",
    "Implication: Long-term effect on business model.",
    "Management preparation/mitigation details from filing."
]

def check_for_placeholder_echo(text: str, field_name: str) -> None:
    if not text:
        return
    def clean(t):
        return set(re.findall(r'\b\w+\b', t.strip().lower()))
    
    clean_text = clean(text)
    if not clean_text:
        return
        
    for p in PLACEHOLDERS:
        clean_p = clean(p)
        if not clean_p:
            continue
        overlap = len(clean_text.intersection(clean_p))
        ratio = overlap / max(len(clean_text), len(clean_p))
        if ratio > 0.85:
            raise ValueError(
                f"Placeholder echo detected in field '{field_name}': '{text[:60]}...' "
                f"matches prompt instruction placeholder '{p[:60]}...' with {ratio*100:.1f}% similarity."
            )

# force the LLM to ground any stat it claims in the actual evidence quote
def verify_numeric_claims_in_field(field_text: str, evidence: str, field_name: str) -> None:
    if not field_text or not evidence:
        return
    claims = re.findall(r'\b\d+(?:\.\d+)?\s*(?:%|percent|x|ratio|dollars?|USD)\b|\b\d+(?:\.\d+)?%|\$\d+(?:\.\d+)?\b', field_text, re.IGNORECASE)
    for claim in claims:
        numbers = re.findall(r'\d+(?:\.\d+)?', claim)
        for num in numbers:
            if num not in evidence:
                raise ValueError(
                    f"Quantitative claim '{claim}' containing '{num}' in '{field_name}' "
                    f"is not supported by the cited evidence. The evidence must contain this figure. "
                    f"Evidence: '{evidence}'"
                )

def split_into_clean_sentences(text: str) -> List[str]:
    normalized = re.sub(r'\s+', ' ', text.strip().lower())
    sentences = [s.strip() for s in re.split(r'\.\s+', normalized) if len(s.strip()) > 15]
    return sentences

class ForeTraceBaseModel(BaseModel):
    @model_validator(mode='after')
    def validate_schema_wide(self) -> 'ForeTraceBaseModel':
        # 1. Check placeholders on all string fields
        for field_name, value in self.__dict__.items():
            if isinstance(value, str):
                check_for_placeholder_echo(value, field_name)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, str):
                        check_for_placeholder_echo(item, field_name)

        # 2. Check evidence fields for bare section labels and minimum length
        bare_section_pattern = re.compile(r"^\s*item\s+\d+[a-z]?(\s+\([^)]*\))?\s*$", re.IGNORECASE)
        for field_name, value in self.__dict__.items():
            if isinstance(value, str) and (field_name == "evidence" or field_name.endswith("_evidence")):
                if bare_section_pattern.match(value):
                    raise ValueError(
                        f"Bare section reference detected in evidence field '{field_name}': '{value}'. "
                        f"evidence must be an actual quoted sentence from the cited section, not the section name."
                    )
                if len(value.strip()) < 15:
                    raise ValueError(
                        f"Evidence text in field '{field_name}' is too short ({len(value)} chars). "
                        f"evidence must be an actual quoted sentence from the cited section, not a brief tag."
                    )

        # 3. Numeric claim grounding
        # Combine any evidence/rationale fields on this specific object to act as the grounding context
        evidence_fields = ["evidence", "moat_strength_evidence", "trajectory_evidence", "relative_rank_evidence", "rationale"]
        evidence_sources = [getattr(self, fn) for fn in evidence_fields if getattr(self, fn, None) and isinstance(getattr(self, fn), str)]
        
        if evidence_sources:
            combined_evidence = " | ".join(evidence_sources)
            # Validate all other string fields on this object against the combined evidence
            for field_name, value in self.__dict__.items():
                if (
                    isinstance(value, str)
                    and field_name not in evidence_fields
                    and field_name not in ["source", "confidence", "probability", "moat_strength", "trajectory", "relative_rank"]
                ):
                    verify_numeric_claims_in_field(value, combined_evidence, field_name)

        return self

class MoatStrength(str, Enum):
    weak = "weak"
    moderate = "moderate"
    strong = "strong"

class Trajectory(str, Enum):
    declining = "declining"
    stable = "stable"
    growing = "growing"

class RelativeRank(str, Enum):
    laggard = "laggard"
    challenger = "challenger"
    leader = "leader"
    dominant = "dominant"

class AnalyzeRequest(ForeTraceBaseModel):
    company_name: str
    ticker: Optional[str] = None

class Signals(ForeTraceBaseModel):
    revenue_trend: str
    debt_posture: str
    expansion_signals: List[str]
    margin_pressure: bool
    layoffs_or_restructuring: bool
    cash_position: str

class StructuralSignal(ForeTraceBaseModel):
    observation: str
    trend: str
    evidence: str
    why_it_matters: str
    future_implication: str
    possible_invalidation: str
    confidence: str
    source: str

class BehavioralSummary(ForeTraceBaseModel):
    observation: str
    evidence: str
    why_it_matters: str
    future_implication: str
    confidence: str
    source: str
    key_forces: List[str]

class RiskSignal(ForeTraceBaseModel):
    observation: str
    evidence: str
    why_it_matters: str
    future_implication: str
    confidence: str
    source: str
    probability: str
    mitigation: str

class Analog(ForeTraceBaseModel):
    type: str
    company: str
    analog_ticker: Optional[str] = None
    year: int
    similarity_score: int
    confidence: int
    corpusPercentile: int
    matchCount: int
    what_they_resembled: str
    action_taken: str
    outcome: str
    key_difference: str
    lessons_learned: str
    invalidation_triggers: str
    citation: str
    similarity_basis: List[str]

class RelationshipContext(ForeTraceBaseModel):
    linked_to: List[str]
    insight: str

class MarketPosition(ForeTraceBaseModel):
    moat_strength: MoatStrength
    moat_strength_evidence: str
    trajectory: Trajectory
    trajectory_evidence: str
    relative_rank: RelativeRank
    relative_rank_evidence: str
    key_dependency: str
    momentum: str

class ChartData(ForeTraceBaseModel):
    name: str
    metric: float
    label: str

class AnalysisReport(ForeTraceBaseModel):
    signals: Signals
    structural_signals: List[StructuralSignal]
    behavioral_summary: BehavioralSummary
    risk_signals: List[RiskSignal]
    behavioral_pattern_identified: str
    analogs: List[Analog]
    relationship_context: RelationshipContext
    market_position: MarketPosition
    chart_data: List[ChartData]
    match_count: int

    @model_validator(mode='after')
    def validate_report(self):
        # Universal cross-signal evidence deduplication
        seen_hashes = {}
        
        def check_field_evidence(evidence_text: str, field_desc: str, group_key: str = None):
            if not evidence_text:
                return
            sentences = split_into_clean_sentences(evidence_text)
            for sentence in sentences:
                sent_hash = hashlib.md5(sentence.encode('utf-8')).hexdigest()
                if sent_hash in seen_hashes:
                    # Allow reuse within the same group (e.g., within market_position)
                    if group_key and seen_hashes[sent_hash]["group"] == group_key:
                        continue
                    raise ValueError(
                        f"Evidence reuse detected: The evidence sentence '{sentence}' in {field_desc} "
                        f"has already been cited in {seen_hashes[sent_hash]['desc']}."
                    )
                seen_hashes[sent_hash] = {"desc": field_desc, "group": group_key}

        check_field_evidence(self.behavioral_summary.evidence, "Behavioral Summary evidence", "summary")
        check_field_evidence(self.market_position.moat_strength_evidence, "Market Position moat strength evidence", "market_position")
        check_field_evidence(self.market_position.trajectory_evidence, "Market Position trajectory evidence", "market_position")
        check_field_evidence(self.market_position.relative_rank_evidence, "Market Position relative rank evidence", "market_position")
        
        for idx, sig in enumerate(self.structural_signals):
            check_field_evidence(sig.evidence, f"Structural Signal #{idx+1} evidence ('{sig.observation[:30]}...')", f"structural_{idx}")
            
        for idx, r_sig in enumerate(self.risk_signals):
            check_field_evidence(r_sig.evidence, f"Risk Signal #{idx+1} evidence ('{r_sig.observation[:30]}...')", f"risk_{idx}")

        for a in self.analogs:
            a.matchCount = self.match_count

        return self

class MitigationLever(ForeTraceBaseModel):
    lever: str
    rationale: str
    analog_basis: str
    risk_if_ignored: str
    expected_upside: Optional[str] = None
