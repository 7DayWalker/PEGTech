"""
Shared escalation-detection heuristic.

Cheap, synchronous, keyword-based — used in two places that need a fast,
no-network-call answer: the rule-based CSR widget stub (services.
csr_response) deciding whether to flag a visitor conversation, and the
inbound WhatsApp webhook deciding whether an existing client's reply
needs staff attention. AI summarization of an escalation (once one is
already flagged) is a separate, deliberately heavier step — see
escalation_summary.py — not something run on every single inbound
message synchronously inside a webhook handler.
"""
from __future__ import annotations

from typing import Optional

NEGATIVE_SENTIMENT_WORDS = (
    "angry", "frustrated", "upset", "unacceptable", "furious", "disappointed",
    "terrible", "awful", "worst", "scam", "ripoff", "rip off", "lawsuit",
    "lawyer", "attorney", "refund", "cancel my", "cancel the", "complaint",
    "unhappy", "fed up", "not happy", "disgusted", "unprofessional",
)


def detect_escalation(text: Optional[str]) -> Optional[str]:
    """Returns a short human-readable reason if `text` looks escalation-
    worthy, else None. Deliberately simple/cheap, not an AI call — this
    runs synchronously on the hot path of a webhook handler."""
    if not text:
        return None
    lower = text.lower()
    hits = [w for w in NEGATIVE_SENTIMENT_WORDS if w in lower]
    if not hits:
        return None
    return f"Message contains negative-sentiment language ({', '.join(hits[:3])})"
