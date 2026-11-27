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
    "email": {"email", "emailaddress", "mail", "contactemail", "e-mail"},
    "website": {"website", "site", "url", "web", "weblink", "homepage"},
    "address": {"address", "streetaddress", "fulladdress", "location", "addr"},
    "city": {"city", "town"},
    "state": {"state", "province", "region"},
    "country": {"country"},
    "service": {"service", "industry", "category", "niche", "businesstype", "sector", "type"},
    "source": {"source", "leadsource", "researchsource"},
    "notes": {"notes", "note", "comments", "comment", "description", "remarks", "research"},
    "score": {"score", "leadscore", "priority", "temperature", "temp"},
    "value_usd": {"value", "valueusd", "dealvalue", "estimatedvalue", "potentialvalue", "budget", "estvalue"},
}

_VALID_SCORES = {"HOT", "WARM", "COLD"}

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
        "address": clamp("address", _lookup(normalized, "address")),
        "city": clamp("city", _lookup(normalized, "city")),
        "state": clamp("state", _lookup(normalized, "state")),
        "country": clamp("country", _lookup(normalized, "country")) or "US",
        "website": clamp("website", _lookup(normalized, "website")),
        "email_confidence": "unverified" if email else "none",
        "whatsapp_opt_in": False,
        "email_opt_in": False,
        "opt_out": False,
        "notes": _lookup(normalized, "notes") or None,
    }
    return MappedLead(fields=fields, warnings=warnings)
