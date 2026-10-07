from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any

import firebase_admin
from fastapi import Depends, Header, HTTPException
from firebase_admin import auth, credentials


@lru_cache(maxsize=1)
def _initialize_firebase() -> None:
    if firebase_admin._apps:
        return
    raw_credentials = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    if not raw_credentials:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_JSON is not configured")
    firebase_admin.initialize_app(credentials.Certificate(json.loads(raw_credentials)))


def _verify(authorization: str | None) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Firebase bearer token required")
    try:
        _initialize_firebase()
        return auth.verify_id_token(authorization.removeprefix("Bearer ").strip())
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {exc}") from exc


def current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    return _verify(authorization)


def admin_user(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    admin_emails = {email.strip().lower() for email in os.getenv("ADMIN_EMAILS", "").split(",") if email.strip()}
    role = user.get("role") or user.get("admin_role") or user.get("claims", {}).get("role")
    if role != "admin" and user.get("email", "").lower() not in admin_emails:
        raise HTTPException(status_code=403, detail="System administrator permission required")
    return user
