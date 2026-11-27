"""
Bulk lead import from a research spreadsheet (CSV or XLSX).

This is the primary top-of-funnel for the agency: staff research local
businesses (classically ones with no website yet) by hand, collate
everything into a spreadsheet, and upload it here to populate the Leads
pipeline directly — rather than relying solely on paid ad campaigns to
generate warm leads. Column headers are matched loosely (case/spacing/
punctuation-insensitive, with common synonyms) specifically so staff don't
have to reformat whatever sheet they already have to fit an exact template.
"""
from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass, field

from openpyxl import load_workbook

# Canonical Lead field -> accepted header spellings, each already
# normalized (lowercase, letters/digits only, no spaces/punctuation).
COLUMN_SYNONYMS: dict[str, set[str]] = {
    "name": {"name", "contactname", "contact", "ownername", "owner", "fullname", "personname"},
    "business_name": {
        "businessname", "business", "company", "companyname", "biz", "bizname",
        "organisation", "organization", "shopname", "storename",
    },
    "phone": {
        "phone", "phonenumber", "mobile", "mobilenumber", "whatsapp", "whatsappnumber",
        "tel", "telephone", "cell", "cellphone", "contactnumber", "number",
    },
    "email": {
        "email", "emailaddress", "mail", "contactemail", "e-mail",
        "candidateemail", "foundemail", "emailfound", "discoveredemail",
    },
    "website": {"website", "site", "url", "web", "weblink", "homepage"},
    "address": {"address", "streetaddress", "fulladdress", "location", "addr"},
    "city": {"city", "town"},
    "state": {"state", "province", "region"},
    "country": {"country"},
    "service": {"service", "industry", "category", "niche", "businesstype", "sector", "type", "googlecategory"},
    "source": {"source", "leadsource", "researchsource"},
    "notes": {"notes", "note", "comments", "comment", "description", "remarks", "research"},
    "score": {"score", "leadscore", "priority", "temperature", "temp"},
    "value_usd": {"value", "valueusd", "dealvalue", "estimatedvalue", "potentialvalue", "budget", "estvalue"},
    # Distinct from `score` (HOT/WARM/COLD deal temperature) — this is
    # specifically "how sure are we this email address is correct",
    # matching an email-finding workflow's own Confidence column.
    "email_confidence": {"confidence", "emailconfidence", "emailfoundconfidence"},
}

_VALID_SCORES = {"HOT", "WARM", "COLD"}

# Columns we don't have a dedicated Lead field for, but shouldn't just
# throw away — folded into the notes block instead so a staff member
# picking up a cold lead sees the full research trail. Keyed by the
# ALREADY-NORMALIZED header; value is a human label.
_NOTES_CONTEXT_LABELS: dict[str, str] = {
    "sourcequery": "Found via search",
    "sourcepage": "Result page",
    "sourceschecked": "Sources checked",
    "status": "Email search status",
    "verified": "Email verified",
    "nextaction": "Next action",
    "unclaimedlistingflag": "Unclaimed Google listing",
}

# Keep these aligned with the column widths on models.Lead.
_MAX_LEN = {
    "name": 120, "business_name": 255, "source": 80, "service": 160,
    "email": 200, "phone": 60, "address": 500, "city": 100, "state": 50,
    "country": 50, "website": 500,
}


def _normalize_header(h: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (h or "").lower())


def _normalize_cell(value) -> str:
    """Flatten any cell value (str/int/float/None) to a clean string,
    fixing Excel's favorite footgun — a long phone number typed as a
    'Number' column silently turning into scientific notation."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return str(value)
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        return f"{value:g}"
    return str(value).strip()


def parse_spreadsheet(data: bytes, filename: str) -> list[dict[str, str]]:
    """Returns a list of raw rows, each a dict of ORIGINAL header -> cell
    value (already stringified/cleaned), in file order. Raises ValueError
    if the file can't be read as either format."""
    name = (filename or "").lower()
    if name.endswith((".xlsx", ".xlsm")):
        return _parse_xlsx(data)
    if name.endswith((".csv", ".txt")):
        return _parse_csv(data)
    # No reliable extension (some upload flows strip it) — sniff by
    # trying XLSX's binary zip signature first, then fall back to CSV.
    if data[:2] == b"PK":
        return _parse_xlsx(data)
    return _parse_csv(data)


def _parse_xlsx(data: bytes) -> list[dict[str, str]]:
    try:
        wb = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    except Exception as e:
        raise ValueError(f"Not a readable Excel file: {e}") from e
    ws = wb.active
    rows_iter = ws.iter_rows(values_only=True)
    try:
        header_row = next(rows_iter)
    except StopIteration:
        return []
    headers = [str(h).strip() if h is not None else "" for h in header_row]
    rows: list[dict[str, str]] = []
    for raw_row in rows_iter:
        if raw_row is None or all(v is None for v in raw_row):
            continue
        row: dict[str, str] = {}
        for i, h in enumerate(headers):
            if not h:
                continue
            row[h] = _normalize_cell(raw_row[i] if i < len(raw_row) else None)
        rows.append(row)
    return rows


def _parse_csv(data: bytes) -> list[dict[str, str]]:
    try:
        text = data.decode("utf-8-sig", errors="replace")
    except Exception as e:
        raise ValueError(f"Couldn't decode file as text: {e}") from e
    reader = csv.DictReader(io.StringIO(text))
    rows: list[dict[str, str]] = []
    for raw_row in reader:
        if not any((v or "").strip() for v in raw_row.values() if v is not None):
            continue
        rows.append({(k or "").strip(): _normalize_cell(v) for k, v in raw_row.items()})
    return rows


def _lookup(row_normalized: dict[str, str], canonical: str) -> str:
    for syn in COLUMN_SYNONYMS[canonical]:
        if syn in row_normalized and row_normalized[syn]:
            return row_normalized[syn]
    return ""


_SCOPE_SUFFIX_RE = re.compile(r"\s+(metro|city|area|region)$", re.IGNORECASE)
_EMPTY_WEBSITE_VALUES = {"missing or empty", "missing", "empty", "n/a", "none", "null", "-"}
# Matches a standard US "Street, City, ST ZIP" address so City/State can be
# recovered even when a sheet only has one combined Address column.
_US_ADDRESS_RE = re.compile(r"^(?P<street>.+),\s*(?P<city>[^,]+),\s*(?P<state>[A-Za-z]{2})\s*(?P<zip>\d{5}(?:-\d{4})?)?$")


def _parse_us_address(address: str) -> tuple[str | None, str | None]:
    """Best-effort split of a 'Street, City, ST ZIP' address into
    (city, state). Returns (None, None) if it doesn't look like that shape
    (e.g. 'Address not published on Google Maps')."""
    m = _US_ADDRESS_RE.match(address.strip())
    if not m:
        return None, None
    return m.group("city").strip(), m.group("state").strip().upper()


_WEBSITE_CHECK_WARNINGS = {
    "website_found": "Independent web check found an existing website for this business — may not fit a no-website campaign.",
    "out_of_business": "Independent web check flags this business as possibly out of business — verify before reaching out.",
}


def _build_notes(normalized: dict[str, str]) -> tuple[str | None, list[str]]:
    """Folds spreadsheet columns that don't have a dedicated Lead field
    (ratings, research trail, website-check result, etc.) into a readable
    notes block instead of silently dropping them, and surfaces anything
    worth a human double-checking (e.g. the business already appears to
    have a website) as an import warning."""
    warnings: list[str] = []
    context: list[str] = []

    explicit_notes = _lookup(normalized, "notes")

    rating = normalized.get("rating")
    review_count = normalized.get("reviewcount")
    if rating:
        context.append(f"Google rating: {rating}\u2605" + (f" ({review_count} reviews)" if review_count else ""))

    web_check = normalized.get("independentwebcheck")
    if web_check:
        context.append(f"Website check: {web_check}")
        warning = _WEBSITE_CHECK_WARNINGS.get(web_check.strip().lower())
        if warning:
            warnings.append(warning)

    maps_url = normalized.get("googlemapsurl")
    if maps_url:
        context.append(f"Google Maps: {maps_url}")

    for key, label in _NOTES_CONTEXT_LABELS.items():
        value = normalized.get(key)
        if not value:
            continue
        if key == "sourceschecked":
            value = value[:500]
        if key == "sourcequery":
            page = normalized.get("sourcepage")
            context.append(f'{label}: "{value}"' + (f" (result #{page})" if page else ""))
            continue
        if key == "sourcepage":
            continue  # folded into sourcequery above
        context.append(f"{label}: {value}")

    parts = []
    if explicit_notes:
        parts.append(explicit_notes)
    if context:
        parts.append("Research context:\n" + "\n".join(f"- {c}" for c in context))
    notes = "\n\n".join(parts) if parts else None
    return notes, warnings


@dataclass
class MappedLead:
    fields: dict
    warnings: list[str] = field(default_factory=list)


def map_row(row: dict[str, str]) -> MappedLead | None:
    """Maps one raw spreadsheet row to Lead model fields. Returns None if
    there's not enough to work with — no name AND no business name — the
    caller should count that as a skipped row."""
    normalized = {_normalize_header(k): v for k, v in row.items() if v}

    name = _lookup(normalized, "name")
    business_name = _lookup(normalized, "business_name")
    if not name and not business_name:
        return None
    if not name:
        name = business_name
    if not business_name:
        business_name = name

    phone = _lookup(normalized, "phone")
    email = _lookup(normalized, "email")
    warnings = []
    if not phone and not email:
        warnings.append("No phone or email on this row — it's been added but can't be contacted yet.")

    score = _lookup(normalized, "score").strip().upper()
    if score not in _VALID_SCORES:
        score = "WARM"

    value_raw = _lookup(normalized, "value_usd")
    try:
        value_usd = float(re.sub(r"[^0-9.]", "", value_raw)) if value_raw else 0.0
    except ValueError:
        value_usd = 0.0

    # City/State, in order of how much we trust the source: an explicit
    # column first, then parsed out of a full street address if there's one
    # (precise), then a "Scope" column (e.g. "Tulsa metro") from Google-
    # Maps-style research exports as a last, approximate resort.
    city = _lookup(normalized, "city")
    state = _lookup(normalized, "state")
    address_value = _lookup(normalized, "address")
    if (not city or not state) and address_value:
        addr_city, addr_state = _parse_us_address(address_value)
        if not city and addr_city:
            city = addr_city
        if not state and addr_state:
            state = addr_state
    if not city:
        scope_raw = normalized.get("scope")
        if scope_raw:
            derived = _SCOPE_SUFFIX_RE.sub("", scope_raw).strip()
            if derived:
                city = derived

    # A "Serper Website Field" (or similar raw scraper output) sometimes
    # holds a real detected URL and sometimes a placeholder like "missing
    # or empty" — only trust it as a website if it isn't one of those.
    website = _lookup(normalized, "website")
    if not website:
        serper_field = normalized.get("serperwebsitefield")
        if serper_field and serper_field.strip().lower() not in _EMPTY_WEBSITE_VALUES:
            website = serper_field

    explicit_confidence = _lookup(normalized, "email_confidence")
    email_confidence = explicit_confidence.strip().lower()[:20] if explicit_confidence else ("unverified" if email else "none")

    notes, context_warnings = _build_notes(normalized)
    warnings.extend(context_warnings)

    def clamp(field_name: str, value: str) -> str | None:
        if not value:
            return None
        limit = _MAX_LEN.get(field_name)
        return value[:limit] if limit else value

    fields = {
        "name": clamp("name", name) or "Unnamed lead",
        "business_name": clamp("business_name", business_name),
        "source": clamp("source", _lookup(normalized, "source") or "Research import"),
        "service": clamp("service", _lookup(normalized, "service")),
        "score": score,
        "value_usd": value_usd,
        "stage": 0,
        "email": clamp("email", email),
        "phone": clamp("phone", phone),
        "address": clamp("address", address_value),
        "city": clamp("city", city),
        "state": clamp("state", state),
        "country": clamp("country", _lookup(normalized, "country")) or "US",
        "website": clamp("website", website),
        "email_confidence": email_confidence,
        "whatsapp_opt_in": False,
        "email_opt_in": False,
        "opt_out": False,
        "notes": notes,
    }
    return MappedLead(fields=fields, warnings=warnings)
