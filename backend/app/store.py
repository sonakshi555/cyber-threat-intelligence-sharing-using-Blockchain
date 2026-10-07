from __future__ import annotations

import os
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore


@lru_cache(maxsize=1)
def db() -> firestore.Client:
    if not firebase_admin._apps:
        raise RuntimeError("Firebase must be initialized before opening Firestore")
    return firestore.client()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_report(data: dict[str, Any]) -> str:
    reference = db().collection("threat_reports").document()
    reference.set({**data, "created_at": utc_now(), "status": "pending"})
    return reference.id


def find_existing_report(organization: str, report_hash: str) -> dict[str, Any] | None:
    for snapshot in db().collection("threat_reports").where("report_hash", "==", report_hash).stream():
        report = {"id": snapshot.id, **snapshot.to_dict()}
        if report.get("organization") == organization:
            return report
    return None


def get_report(report_id: str) -> tuple[firestore.DocumentReference, dict[str, Any]]:
    reference = db().collection("threat_reports").document(report_id)
    snapshot = reference.get()
    if not snapshot.exists:
        raise KeyError(report_id)
    return reference, {"id": snapshot.id, **snapshot.to_dict()}


def list_reports(status: str | None = None) -> list[dict[str, Any]]:
    query = db().collection("threat_reports")
    if status:
        query = query.where("status", "==", status)
    reports = [{"id": snapshot.id, **snapshot.to_dict()} for snapshot in query.stream()]
    return sorted(reports, key=lambda report: report.get("created_at", ""), reverse=True)


def write_audit(report_id: str, action: str, user: dict[str, Any], details: dict[str, Any] | None = None) -> None:
    db().collection("threat_audit").add({
        "report_id": report_id,
        "action": action,
        "actor_uid": user.get("uid"),
        "actor_email": user.get("email"),
        "created_at": utc_now(),
        "details": details or {},
    })
