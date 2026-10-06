"""
Zero-shot domain classifier using facebook/bart-large-mnli.

This is the fast primary classifier in Beacon's hybrid pipeline.
It runs entirely locally (CPU), needs no API key, and classifies
in ~150-300ms vs ~3-8s for the Ollama LLM path.

Decision logic:
  - multi_label=True: each domain gets an independent confidence score
  - Single domain > HIGH_CONF and gap > GAP_THRESHOLD → single_intent (fast path)
  - Two domains both > MULTI_THRESHOLD → multi_intent (route to Ollama for full reasoning)
  - All domains low AND out-of-scope high → out_of_scope (fast path)
  - Anything uncertain → Ollama (slow path, full reasoning)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from functools import lru_cache
from typing import List

logger = logging.getLogger(__name__)

# ── Tunable thresholds ────────────────────────────────────────────────────────
# A domain with score above this AND a gap greater than GAP_THRESHOLD to the
# second-best domain triggers the fast single-intent path.
# Lower than the original 0.75 so clear queries don't fall through to Ollama.
HIGH_CONF_THRESHOLD = 0.55

# If the second-best domain is within this margin of the best, we consider
# the query ambiguous and let Ollama handle it.
GAP_THRESHOLD = 0.15

# If two or more domains BOTH score above this, assume multi-intent.
MULTI_INTENT_THRESHOLD = 0.35

# If out-of-scope label scores above this AND all domain labels are below
# MULTI_INTENT_THRESHOLD, treat as out_of_scope immediately.
# Raised from 0.60 → 0.80 to prevent legitimate workplace questions from
# being incorrectly labelled out-of-scope.
OUT_OF_SCOPE_THRESHOLD = 0.80

# Candidate labels sent to the zero-shot model.
# More descriptive labels → better BART alignment with real employee queries.
DOMAIN_LABELS = [
    "employee HR leave benefits payroll work from home policy",
    "IT technology VPN password laptop email account software hardware support",
    "Finance expense reimbursement travel payment invoice purchase budget",
]

OUT_OF_SCOPE_LABEL = "general unrelated question not about work or employment"

ALL_LABELS = DOMAIN_LABELS + [OUT_OF_SCOPE_LABEL]

# Mapping from natural-language label → canonical domain name
LABEL_TO_DOMAIN = {
    DOMAIN_LABELS[0]: "HR",
    DOMAIN_LABELS[1]: "IT",
    DOMAIN_LABELS[2]: "FINANCE",
}


@dataclass
class ZeroShotResult:
    """Output from the BART zero-shot classifier."""

    # Ordered list of (domain, score) pairs, descending by score
    domain_scores: List[tuple[str, float]]

    # Routing decision made by this fast classifier
    # Possible values: "single_intent", "multi_intent", "out_of_scope", "defer_to_llm"
    decision: str

    # The winning domain (only set when decision is single_intent)
    primary_domain: str | None = None

    # Both domains (only set when decision is multi_intent)
    secondary_domain: str | None = None

    @property
    def confidence(self) -> float:
        return self.domain_scores[0][1] if self.domain_scores else 0.0


@lru_cache(maxsize=1)
def _load_pipeline():
    """
    Load bart-large-mnli once and cache it for the process lifetime.
    First call downloads the model (~1.6 GB) to HuggingFace cache.
    Subsequent calls are instant.
    """
    from transformers import pipeline

    logger.info("Loading facebook/bart-large-mnli zero-shot classifier...")
    clf = pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli",
        device=-1,          # CPU; set to 0 for GPU
    )
    logger.info("bart-large-mnli loaded and ready.")
    return clf


def classify_zero_shot(query: str) -> ZeroShotResult:
    """
    Run the BART zero-shot classifier and return a ZeroShotResult.
    Uses multi_label=True so each domain gets an independent score.
    """
    clf = _load_pipeline()

    raw = clf(
        query,
        candidate_labels=ALL_LABELS,
        multi_label=True,
    )

    # Build score map: label → score
    score_map: dict[str, float] = dict(zip(raw["labels"], raw["scores"]))

    # Extract domain scores
    domain_scores = [
        (LABEL_TO_DOMAIN[label], score_map[label])
        for label in DOMAIN_LABELS
    ]
    domain_scores.sort(key=lambda x: x[1], reverse=True)

    out_of_scope_score = score_map[OUT_OF_SCOPE_LABEL]

    best_domain, best_score = domain_scores[0]
    second_domain, second_score = domain_scores[1]

    logger.info(
        "BART scores — %s: %.3f | %s: %.3f | %s: %.3f | oos: %.3f",
        domain_scores[0][0], domain_scores[0][1],
        domain_scores[1][0], domain_scores[1][1],
        domain_scores[2][0], domain_scores[2][1],
        out_of_scope_score,
    )

    # ── Decision rules ────────────────────────────────────────────────────────

    # 1. Out of scope: high oos score AND all domains low
    if (
        out_of_scope_score >= OUT_OF_SCOPE_THRESHOLD
        and best_score < MULTI_INTENT_THRESHOLD
    ):
        return ZeroShotResult(
            domain_scores=domain_scores,
            decision="out_of_scope",
        )

    # 2. Multi-intent: two domains both score high
    if best_score >= MULTI_INTENT_THRESHOLD and second_score >= MULTI_INTENT_THRESHOLD:
        return ZeroShotResult(
            domain_scores=domain_scores,
            decision="multi_intent",
            primary_domain=best_domain,
            secondary_domain=second_domain,
        )

    # 3. Single intent: high confidence, clear gap to second-best
    if best_score >= HIGH_CONF_THRESHOLD and (best_score - second_score) >= GAP_THRESHOLD:
        # Prevent fast-pathing compound queries that BART might miss
        if " and " not in query.lower():
            return ZeroShotResult(
                domain_scores=domain_scores,
                decision="single_intent",
                primary_domain=best_domain,
            )

    # 4. Everything else: defer to Ollama for full reasoning
    return ZeroShotResult(
        domain_scores=domain_scores,
        decision="defer_to_llm",
        primary_domain=best_domain,
    )
