"""
Hybrid intent classifier for Beacon.

Architecture:
  1. facebook/bart-large-mnli  (fast, ~150-300ms, CPU, always runs)
     ├─ high confidence single domain → return immediately (no Ollama call)
     ├─ out of scope high confidence  → return immediately
     └─ ambiguous / multi-domain      → fall through to Ollama

  2. Ollama beacon-router / qwen3:4b  (slow, ~3-8s, full reasoning)
     Handles: multi-intent, clarification required, ambiguous queries.
     Uses a simplified hand-crafted JSON schema to avoid the LLM getting
     confused by a complex Pydantic-generated schema.

Bugs fixed vs previous implementation:
  - needs_clarification no longer required in LLM output (auto-derived from status)
  - multi_intent no longer crashes when LLM returns 1 intent (soft recovery)
  - clarification_required no longer crashes when needs_clarification missing
  - Intent names: canonical list provided in system prompt
"""

from __future__ import annotations

import json
import logging
import os
import pickle
import numpy as np
from typing import Any

from pydantic import ValidationError

from app.schemas.routing import Domain, Intent, RoutingResult
from app.services.llm_service import llm_service
from app.services.zero_shot_classifier import classify_zero_shot

logger = logging.getLogger(__name__)

# ── Local Fast Classifier ──────────────────────────────────────────────────
_local_clf = None
_local_mlb = None
_encoder = None

def _get_local_model():
    global _local_clf, _local_mlb, _encoder
    if _encoder is None:
        try:
            from sentence_transformers import SentenceTransformer
            _encoder = SentenceTransformer("all-MiniLM-L6-v2")
            model_path = os.path.join(os.path.dirname(__file__), "..", "models", "intent_classifier.pkl")
            with open(model_path, "rb") as f:
                data = pickle.load(f)
                _local_clf = data["clf"]
                _local_mlb = data["mlb"]
        except Exception as e:
            logger.error(f"Failed to load local model: {e}")
            return False
    return True


# ── Canonical intent names sent to the LLM ───────────────────────────────────
# The LLM MUST choose from these per domain. This eliminates free-text drift
# (e.g. "password_forgetting" vs "password_reset").

CANONICAL_INTENTS = {
    "HR": [
        "leave_balance", "leave_request", "work_from_home", "attendance",
        "payroll", "employee_benefits", "onboarding", "offboarding",
        "resignation", "compensatory_off", "hr_policy", "performance_review",
    ],
    "IT": [
        "vpn_troubleshooting", "password_reset", "account_access",
        "laptop_request", "network_issue", "email_issue", "software_access",
        "hardware_request", "device_setup", "it_policy",
    ],
    "FINANCE": [
        "travel_reimbursement", "expense_reimbursement", "payment_status",
        "invoice_submission", "purchase_approval", "corporate_card",
        "budget_query", "receipt_submission",
    ],
}


# ── Simplified JSON schema for Ollama structured output ──────────────────────
# Deliberately minimal so that small LLMs can reliably produce it.
# We do NOT use RoutingResult.model_json_schema() — that was too complex.

_OLLAMA_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "status": {
            "type": "string",
            "enum": [
                "single_intent",
                "multi_intent",
                "clarification_required",
                "out_of_scope",
            ],
        },
        "intents": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "domain": {"type": "string", "enum": ["HR", "IT", "FINANCE"]},
                    "intent": {"type": "string"},
                    "query": {"type": "string"},
                },
                "required": ["domain", "intent", "query"],
            },
        },
        "clarification_question": {"type": "string"},
    },
    "required": ["status", "intents"],
}


# ── System prompt for Ollama ──────────────────────────────────────────────────

def _build_system_prompt() -> str:
    hr_intents = ", ".join(CANONICAL_INTENTS["HR"])
    it_intents = ", ".join(CANONICAL_INTENTS["IT"])
    fin_intents = ", ".join(CANONICAL_INTENTS["FINANCE"])

    return f"""You are Beacon, an enterprise employee query intent classifier.

Supported domains: HR, IT, FINANCE.

DOMAIN DEFINITIONS:
HR: leave, attendance, payroll, work from home, benefits, onboarding, resignation.
IT: VPN, passwords, accounts, laptops, network, email, software, hardware.
FINANCE: expense claims, reimbursements, invoices, purchases, payments, corporate cards.

CANONICAL INTENT NAMES — you MUST use one of these exact strings per domain:
HR:      {hr_intents}
IT:      {it_intents}
FINANCE: {fin_intents}

If none fit exactly, choose the closest match.

CLASSIFICATION RULES:
1. single_intent: exactly 1 domain, return 1 intent object.
2. multi_intent: 2+ distinct domains in the same query, return 1 intent per domain.
3. clarification_required: genuinely ambiguous — which system/domain is unclear.
   Set clarification_question to a short, specific follow-up question.
4. out_of_scope: not related to HR, IT, or Finance at all.

DECISION RULES:
- Never classify an HR/IT/Finance question as out_of_scope.
- Use clarification_required ONLY when the domain is truly unclear.
- Do NOT answer the user's question. Only classify it.
- Return only the structured JSON output.

EXAMPLES:
Query: "How many leaves do I have?"
{{"status":"single_intent","intents":[{{"domain":"HR","intent":"leave_balance","query":"How many leaves do I have?"}}],"clarification_question":""}}

Query: "My VPN is broken and can I work from home?"
{{"status":"multi_intent","intents":[{{"domain":"IT","intent":"vpn_troubleshooting","query":"My VPN is broken"}},{{"domain":"HR","intent":"work_from_home","query":"Can I work from home?"}}],"clarification_question":""}}

Query: "I need a laptop, how do I expense my travel, and what is the leave policy?"
{{"status":"multi_intent","intents":[{{"domain":"IT","intent":"laptop_request","query":"I need a laptop"}},{{"domain":"FINANCE","intent":"travel_reimbursement","query":"how do I expense my travel"}},{{"domain":"HR","intent":"hr_policy","query":"what is the leave policy"}}],"clarification_question":""}}

Query: "I cannot access my account."
{{"status":"clarification_required","intents":[],"clarification_question":"Which account or system are you unable to access — email, VPN, HR portal, or something else?"}}

Query: "Tell me a joke."
{{"status":"out_of_scope","intents":[],"clarification_question":""}}
"""


SYSTEM_PROMPT = _build_system_prompt()


# ── Ollama path ───────────────────────────────────────────────────────────────

async def _classify_via_ollama(query: str) -> RoutingResult:
    """Full LLM classification. Called for ambiguous / multi-intent queries."""

    logger.info("Routing to Ollama for full reasoning")

    raw = await llm_service.generate_structured(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=query,
        response_schema=_OLLAMA_SCHEMA,
    )

    logger.debug("Ollama raw response: %r", raw)

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("Ollama returned invalid JSON: %r", raw)
        raise RuntimeError(f"Ollama returned invalid JSON: {exc}") from exc

    status = parsed.get("status", "")
    raw_intents = parsed.get("intents", [])
    clarification = parsed.get("clarification_question", "") or ""

    # Normalise intent names to canonical set (fuzzy match)
    intents = []
    for item in raw_intents:
        domain = str(item.get("domain", "")).upper()
        if domain not in ("HR", "IT", "FINANCE"):
            logger.warning("Ignoring intent with unknown domain: %r", domain)
            continue
        raw_intent_name = str(item.get("intent", "")).lower().strip()
        canonical = _canonicalise_intent(domain, raw_intent_name)
        q_lower = str(item.get("query", query)).lower()
        if domain == "HR" and "work from home" in q_lower:
            canonical = "work_from_home"
        if "purchase" in q_lower:
            domain = "FINANCE"
            canonical = "purchase_approval"
        if "quit" in q_lower or canonical == "offboarding":
            domain = "HR"
            canonical = "resignation"
        if "paid" in q_lower or "paycheck" in q_lower:
            domain = "HR"
            canonical = "payroll"
        if "ticket" in q_lower and "status" in q_lower and "it" not in q_lower:
            return RoutingResult(
                status="clarification_required",
                clarification_question="Which department is this ticket for (HR, IT, or Finance)?"
            )
            
        intents.append(Intent(
            domain=domain,  # type: ignore[arg-type]
            intent=canonical,
            query=str(item.get("query", query)),
        ))

    # Soft recovery: if LLM says multi_intent but only gave 1 intent
    if status == "multi_intent" and len(intents) == 1:
        logger.warning("LLM said multi_intent but returned 1 intent — downgrading to single_intent")
        status = "single_intent"

    # Soft recovery: if LLM says clarification_required but no question
    if status == "clarification_required" and not clarification.strip():
        clarification = "Could you please clarify what you need help with?"

    try:
        return RoutingResult(
            status=status,  # type: ignore[arg-type]
            intents=intents,
            clarification_question=clarification if clarification.strip() else None,
        )
    except ValidationError as exc:
        logger.exception("Pydantic validation failed after normalisation. Parsed: %r", parsed)
        raise RuntimeError(f"Classification schema error: {exc}") from exc


def _canonicalise_intent(domain: str, raw_name: str) -> str:
    """
    Map the LLM's free-text intent name to the nearest canonical name.
    Falls back to the raw name (snake_cased) if no match found.
    """
    canonical_list = CANONICAL_INTENTS.get(domain, [])
    raw_normalised = raw_name.replace(" ", "_").replace("-", "_")

    # Exact match
    if raw_normalised in canonical_list:
        return raw_normalised

    # Substring match: find canonical that shares the most words
    raw_words = set(raw_normalised.split("_"))
    best_match = None
    best_overlap = 0
    for candidate in canonical_list:
        overlap = len(raw_words & set(candidate.split("_")))
        if overlap > best_overlap:
            best_overlap = overlap
            best_match = candidate

    if best_match and best_overlap > 0:
        logger.debug(
            "Canonicalised intent '%s' → '%s' (overlap=%d)",
            raw_name, best_match, best_overlap,
        )
        return best_match

    # No match: return snake_cased raw name
    return raw_normalised


# ── BART fast path ────────────────────────────────────────────────────────────

def _infer_intent_name(domain: str, query: str) -> str:
    """
    Lightweight keyword-based intent inference for the BART fast path.
    Used only when Ollama is NOT called, so we still return a meaningful intent.
    """
    q = query.lower()

    if domain == "HR":
        if any(w in q for w in ("leave", "leaves", "vacation", "pto", "time off")):
            return "leave_balance"
        if any(w in q for w in ("work from home", "wfh", "remote")):
            return "work_from_home"
        if any(w in q for w in ("salary", "payslip", "payroll")):
            return "payroll"
        if any(w in q for w in ("benefit", "insurance", "medical")):
            return "employee_benefits"
        if any(w in q for w in ("onboard", "join", "joining")):
            return "onboarding"
        if any(w in q for w in ("resign", "notice", "quit")):
            return "resignation"
        return "hr_policy"

    if domain == "IT":
        if any(w in q for w in ("vpn", "virtual private")):
            return "vpn_troubleshooting"
        if any(w in q for w in ("password", "forgot", "reset")):
            return "password_reset"
        if any(w in q for w in ("email", "mail", "outlook")):
            return "email_issue"
        if any(w in q for w in ("laptop", "computer", "device")):
            return "laptop_request"
        if any(w in q for w in ("access", "login", "sign in", "account")):
            return "account_access"
        if any(w in q for w in ("network", "internet", "wifi")):
            return "network_issue"
        if any(w in q for w in ("software", "install", "application")):
            return "software_access"
        return "it_policy"

    if domain == "FINANCE":
        if any(w in q for w in ("travel", "trip", "flight", "hotel")):
            return "travel_reimbursement"
        if any(w in q for w in ("claim", "expense", "receipt")):
            return "expense_reimbursement"
        if any(w in q for w in ("status", "payment", "paid", "pending")):
            return "payment_status"
        if any(w in q for w in ("purchase", "buy", "procure", "approve")):
            return "purchase_approval"
        if any(w in q for w in ("invoice", "bill", "vendor")):
            return "invoice_submission"
        return "budget_query"

    return "general_query"


# ── Main entry point ──────────────────────────────────────────────────────────

async def classify_query(user_query: str) -> RoutingResult:
    """
    Fast Multi-Label Classifier:
    Uses the trained local sentence-transformer model to instantly classify
    single and multi-intent queries across HR, IT, and Finance.
    """
    logger.info("classify_query: %r", user_query)

    if _get_local_model():
        # Fast local prediction
        query_vec = _encoder.encode([user_query])
        probs = _local_clf.predict_proba(query_vec)[0]
        
        THRESHOLD = 0.25 # Lower threshold to catch multi-intents easily
        predictions = (probs >= THRESHOLD).astype(int)
        
        # Safe inverse transform
        try:
            predicted_labels = _local_mlb.inverse_transform(np.array([predictions]))[0]
        except Exception as e:
            predicted_labels = []
            
        if len(predicted_labels) == 0:
            logger.info("No intents passed threshold -> out_of_scope")
            return RoutingResult.make_out_of_scope()
            
        intents = []
        for label in predicted_labels:
            parts = label.split("/")
            if len(parts) == 2:
                domain, intent = parts
                intents.append(Intent(domain=domain, intent=intent, query=user_query))
                
        if len(intents) == 1:
            status = "single_intent"
        else:
            status = "multi_intent"
            
        logger.info(f"Local model predicted: {status} with intents {predicted_labels}")
        return RoutingResult(status=status, intents=intents, clarification_question=None)

    # ── Fallback if model fails to load ───────────────────────────────────────
    logger.warning("Local model not found. Falling back to zero-shot...")
    bart_result = classify_zero_shot(user_query)
    
    if bart_result.decision == "out_of_scope":
        return RoutingResult.make_out_of_scope()
        
    if bart_result.decision == "single_intent" and bart_result.primary_domain:
        domain: Domain = bart_result.primary_domain  # type: ignore[assignment]
        intent_name = _infer_intent_name(domain, user_query)
        return RoutingResult.make_single(domain=domain, intent=intent_name, query=user_query)

    return await _classify_via_ollama(user_query)