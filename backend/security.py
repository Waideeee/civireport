import hashlib
import hmac
import os
import time

from dotenv import load_dotenv
from fastapi import Header, HTTPException, status


load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

ADMIN_ROLES = {"admin", "barangay_admin"}
ELEVATED_ROLES = ADMIN_ROLES | {"superadmin"}

# Reject signed requests older than this many seconds (replay protection).
SIGNATURE_MAX_AGE_SECONDS = 300


def _internal_api_key() -> str:
    return os.getenv("INTERNAL_API_KEY", "").strip()


def _expected_signature(timestamp: str, actor_id: str, role: str, secret: str) -> str:
    payload = f"{timestamp}|{actor_id}|{role}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()


def require_internal_api_key(
    x_civireport_timestamp: str | None = Header(default=None, alias="X-CiviReport-Timestamp"),
    x_civireport_actor_id: str | None = Header(default=None, alias="X-CiviReport-Actor-Id"),
    x_civireport_actor_role: str | None = Header(default=None, alias="X-CiviReport-Actor-Role"),
    x_civireport_signature: str | None = Header(default=None, alias="X-CiviReport-Signature"),
):
    secret = _internal_api_key()
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Internal API key is not configured.",
        )

    if not x_civireport_timestamp or not x_civireport_signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized internal API request.",
        )

    try:
        request_ts = int(x_civireport_timestamp)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized internal API request.",
        )

    if abs(int(time.time()) - request_ts) > SIGNATURE_MAX_AGE_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signed request expired.",
        )

    actor_id = x_civireport_actor_id or ""
    role = (x_civireport_actor_role or "").strip().lower()

    expected = _expected_signature(x_civireport_timestamp, actor_id, role, secret)

    if not hmac.compare_digest(expected, x_civireport_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized internal API request.",
        )


def require_admin_actor(
    x_civireport_timestamp: str | None = Header(default=None, alias="X-CiviReport-Timestamp"),
    x_civireport_actor_id: str | None = Header(default=None, alias="X-CiviReport-Actor-Id"),
    x_civireport_actor_role: str | None = Header(default=None, alias="X-CiviReport-Actor-Role"),
    x_civireport_signature: str | None = Header(default=None, alias="X-CiviReport-Signature"),
):
    require_internal_api_key(
        x_civireport_timestamp=x_civireport_timestamp,
        x_civireport_actor_id=x_civireport_actor_id,
        x_civireport_actor_role=x_civireport_actor_role,
        x_civireport_signature=x_civireport_signature,
    )

    role = (x_civireport_actor_role or "").strip().lower()
    if role not in ELEVATED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required for this action.",
        )


def require_superadmin_actor(
    x_civireport_timestamp: str | None = Header(default=None, alias="X-CiviReport-Timestamp"),
    x_civireport_actor_id: str | None = Header(default=None, alias="X-CiviReport-Actor-Id"),
    x_civireport_actor_role: str | None = Header(default=None, alias="X-CiviReport-Actor-Role"),
    x_civireport_signature: str | None = Header(default=None, alias="X-CiviReport-Signature"),
):
    require_internal_api_key(
        x_civireport_timestamp=x_civireport_timestamp,
        x_civireport_actor_id=x_civireport_actor_id,
        x_civireport_actor_role=x_civireport_actor_role,
        x_civireport_signature=x_civireport_signature,
    )

    role = (x_civireport_actor_role or "").strip().lower()
    if role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access is required for this action.",
        )
