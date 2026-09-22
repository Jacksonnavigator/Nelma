import hashlib
import os
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from fastapi import status

from app.core.config import Settings
from app.core.exceptions import AppException
from app.core.roles import SessionAudience, coerce_audience

try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerificationError, VerifyMismatchError
except ImportError:  # pragma: no cover - exercised only on locked-down systems without the native binding
    PasswordHasher = None  # type: ignore[assignment]
    VerificationError = VerifyMismatchError = ValueError  # type: ignore[misc, assignment]

TokenType = Literal["access", "refresh"]
PBKDF2_SCHEME = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 60_000 if os.getenv("APP_ENV") == "test" else 600_000

_password_hasher = PasswordHasher() if PasswordHasher else None


def utc_now() -> datetime:
    return datetime.now(UTC)


def ensure_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


def new_uuid() -> str:
    return str(uuid.uuid4())


def _hash_password_fallback(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), PBKDF2_ITERATIONS)
    return f"{PBKDF2_SCHEME}${PBKDF2_ITERATIONS}${salt}${digest.hex()}"


def _verify_password_fallback(password: str, password_hash: str) -> bool:
    try:
        scheme, iterations_text, salt, expected = password_hash.split("$", 3)
        if scheme != PBKDF2_SCHEME:
            return False
        iterations = int(iterations_text)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), iterations).hex()
    except (TypeError, ValueError):
        return False
    return secrets.compare_digest(digest, expected)


def hash_password(password: str) -> str:
    if _password_hasher is not None:
        return _password_hasher.hash(password)
    return _hash_password_fallback(password)


def verify_password(password: str, password_hash: str) -> bool:
    if password_hash.startswith(PBKDF2_SCHEME + "$"):
        return _verify_password_fallback(password, password_hash)
    if _password_hasher is None:
        return False
    try:
        return _password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError):
        return False


def sha256_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_reset_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def create_jwt(
    *,
    subject: str,
    token_type: TokenType,
    settings: Settings,
    expires_delta: timedelta,
    audience: SessionAudience | str = SessionAudience.MOBILE,
    jti: str | None = None,
) -> tuple[str, datetime, str]:
    expires_at = utc_now() + expires_delta
    token_jti = jti or new_uuid()
    resolved_audience = coerce_audience(audience)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "aud": resolved_audience.value,
        "jti": token_jti,
        "iat": int(utc_now().timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, expires_at, token_jti


def decode_jwt(
    token: str,
    settings: Settings,
    expected_type: TokenType,
    expected_audience: SessionAudience | str = SessionAudience.MOBILE,
) -> dict[str, Any]:
    audience = coerce_audience(expected_audience).value
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm], audience=audience)
    except jwt.ExpiredSignatureError as exc:
        raise AppException("TOKEN_EXPIRED", "Your session has expired.", status.HTTP_401_UNAUTHORIZED) from exc
    except jwt.InvalidAudienceError as exc:
        raise AppException("INVALID_TOKEN_AUDIENCE", "Authentication is not valid for this application surface.", status.HTTP_401_UNAUTHORIZED) from exc
    except jwt.PyJWTError as exc:
        raise AppException("INVALID_TOKEN", "Authentication is required.", status.HTTP_401_UNAUTHORIZED) from exc
    if payload.get("type") != expected_type:
        raise AppException("INVALID_TOKEN", "Authentication is required.", status.HTTP_401_UNAUTHORIZED)
    return payload



