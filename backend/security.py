import os

from dotenv import load_dotenv
from fastapi import Header, HTTPException, status


load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

ADMIN_ROLES = {"admin", "barangay_admin"}
ELEVATED_ROLES = ADMIN_ROLES | {"superadmin"}


def _internal_api_key() -> str:
    return os.getenv("INTERNAL_API_KEY", "").strip()


def require_internal_api_key(
    x_civireport_internal_key: str | None = Header(default=None, alias="X-CiviReport-Internal-Key"),
):
    expected_key = _internal_api_key()
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Internal API key is not configured.",
        )

    if x_civireport_internal_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized internal API request.",
        )


def require_admin_actor(
    x_civireport_actor_role: str | None = Header(default=None, alias="X-CiviReport-Actor-Role"),
):
    role = (x_civireport_actor_role or "").strip().lower()
    if role not in ELEVATED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required for this action.",
        )


def require_superadmin_actor(
    x_civireport_actor_role: str | None = Header(default=None, alias="X-CiviReport-Actor-Role"),
):
    role = (x_civireport_actor_role or "").strip().lower()
    if role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access is required for this action.",
        )
