"""
Security utilities: password hashing (bcrypt), JWT creation/verification.
"""
import hashlib, hmac, secrets, base64
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt

from app.config import JWT_SECRET, JWT_ALG, JWT_TTL_MINUTES


def hash_password(password: str, salt: str | None = None) -> str:
    """PBKDF2-SHA256 password hashing."""
    salt = salt or secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 200_000)
    return f"pbkdf2${salt}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, salt, hexhash = stored.split("$", 2)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 200_000)
        return hmac.compare_digest(dk.hex(), hexhash)
    except Exception:
        return False


def issue_token(
    subject: str,
    typ: str = "staff",
    role: str = "owner",
    client_id: Optional[int] = None,
    name: str = "",
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "typ": typ,
        "role": role,
        "name": name,
        "client_id": client_id,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_TTL_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
