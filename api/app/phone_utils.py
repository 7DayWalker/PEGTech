"""Shared phone-number comparison helpers.

Used both by the WhatsApp webhook (matching an inbound wa_id to an
existing Lead) and by the bulk lead-import feature (deduping newly
uploaded rows against existing leads) — phone numbers in the wild show up
in a dozen inconsistent formats (+234..., 234..., 0-prefixed local format,
spaces/dashes), so comparisons are done on the last 10 digits only.
"""


def normalize_phone(raw: str | None) -> str:
    if not raw:
        return ""
    return "".join(ch for ch in raw if ch.isdigit())


def phones_match(a: str | None, b: str | None) -> bool:
    da, db_ = normalize_phone(a), normalize_phone(b)
    if len(da) < 7 or len(db_) < 7:
        return False
    return da[-10:] == db_[-10:]
