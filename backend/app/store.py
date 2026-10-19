from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any

try:
    import firebase_admin
    from firebase_admin import firestore
except ImportError:
    firebase_admin = None
    firestore = None

import json
import tempfile
from pathlib import Path

# In-memory store fallback when Firestore credentials are unavailable
_PERSISTENCE_FILE = Path(tempfile.gettempdir()) / "cti_reports_store.json"

_memory_reports: dict[str, dict[str, Any]] = {
    "rep-pending-01": {
        "id": "rep-pending-01",
        "organization": "FinTech Nexus Corp",
        "attack_type": "Brute Force",
        "severity": "HIGH",
        "record_count": 24800,
        "created_at": "2026-10-18T22:30:00Z",
        "report_hash": "c819204810293847102938471029384710293847102938471029384710293847",
        "sensitive_data_hash": "d910283740192837401928374019283740192837401928374019283740192837",
        "submitted_by": "soc-lead@fintechnexus.com",
        "source_filename": "auth_audit_2026_q4.csv",
        "top_indicators": ["failed_ssh", "user_enumeration", "ip_velocity", "pass_spray"],
        "metrics": {"accuracy": 0.972, "precision": 0.961, "recall": 0.954, "f1_score": 0.957},
        "status": "pending",
        "solution": "[ACCESS SECURITY LOCKOUT - HIGH SEVERITY]\n1. Triggered automated Fail2ban progressive lockout on all ingress SSH/VPN/Auth gateways; banned attacking botnet IPs after 3 failed attempts.\n2. Implemented exponential delay backoff (15s multiplier) and mandatory CAPTCHA challenges for authentication attempts matching failed_ssh, user_enumeration.\n3. Enforced Zero-Trust IP Geo-fencing and disabled legacy password-only auth for privileged administrator accounts.\n4. Validated that all 24,800 unauthorized credential spray attempts were stopped with zero compromised credentials.",
    },
    "rep-pending-02": {
        "id": "rep-pending-02",
        "organization": "CyberCore Infrastructure",
        "attack_type": "DDoS",
        "severity": "CRITICAL",
        "record_count": 67300,
        "created_at": "2026-10-18T23:45:00Z",
        "report_hash": "e719204810293847102938471029384710293847102938471029384710293847",
        "sensitive_data_hash": "f810283740192837401928374019283740192837401928374019283740192837",
        "submitted_by": "operator@cybercore.net",
        "source_filename": "edge_traffic_anomaly.csv",
        "top_indicators": ["syn_flood", "pps_spike", "bandwidth_surge", "spoofed_udp"],
        "metrics": {"accuracy": 0.985, "precision": 0.978, "recall": 0.971, "f1_score": 0.974},
        "status": "pending",
        "solution": "[CONTAINMENT COMPLETED - CRITICAL SEVERITY]\n1. Diverted incoming ingress traffic through BGP Anycast volumetric scrubbing center; scrubbed 67,300 anomalous request flows matching signature indicators (syn_flood, pps_spike).\n2. Activated adaptive SYN-cookie protection and lowered half-open TCP connection timeout to 12s on perimeter load balancers.\n3. Deployed Layer-7 edge rate-limiting rules (max 120 req/min per client IP) across Cloudflare/WAF with geo-distributed tarpit responses.\n4. Upstream ISP transit filter engaged for volumetric spoofed CIDR blocks with automated RTBH (Remote Triggered Black Hole) routing.\nVerification: Traffic telemetry returned to baseline. ML verification confidence: 98.5%.",
    }
}
_memory_audit: list[dict[str, Any]] = []

def _save_store_to_disk() -> None:
    try:
        _PERSISTENCE_FILE.write_text(json.dumps(_memory_reports, indent=2))
    except Exception:
        pass

def _load_store_from_disk() -> None:
    try:
        if _PERSISTENCE_FILE.exists():
            data = json.loads(_PERSISTENCE_FILE.read_text())
            if isinstance(data, dict):
                _memory_reports.update(data)
    except Exception:
        pass

_load_store_from_disk()


def is_firestore_available() -> bool:
    try:
        return bool(firebase_admin._apps and os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON"))
    except Exception:
        return False


def db():
    if not is_firestore_available():
        return None
    return firestore.client()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class MemoryDocRef:
    def __init__(self, doc_id: str):
        self.id = doc_id

    def update(self, fields: dict[str, Any]) -> None:
        if self.id in _memory_reports:
            _memory_reports[self.id].update(fields)
            _save_store_to_disk()


def create_report(data: dict[str, Any]) -> str:
    database = db()
    created_time = utc_now()
    report_data = {
        **data,
        "solution": data.get("solution", ""),
        "severity": data.get("severity", "HIGH"),
        "created_at": created_time,
        "status": "pending",
    }
    if database is not None:
        reference = database.collection("threat_reports").document()
        reference.set(report_data)
        return reference.id
    else:
        new_id = f"rep_{uuid.uuid4().hex[:12]}"
        _memory_reports[new_id] = {"id": new_id, **report_data}
        _save_store_to_disk()
        return new_id


def find_existing_report(organization: str, report_hash: str) -> dict[str, Any] | None:
    database = db()
    if database is not None:
        for snapshot in database.collection("threat_reports").where("report_hash", "==", report_hash).limit(5).stream():
            report = {"id": snapshot.id, **snapshot.to_dict()}
            if report.get("organization") == organization:
                return report
        return None
    else:
        for doc_id, report in _memory_reports.items():
            if report.get("organization") == organization and report.get("report_hash") == report_hash:
                return report
        return None


def get_report(report_id: str) -> tuple[Any, dict[str, Any]]:
    database = db()
    if database is not None:
        reference = database.collection("threat_reports").document(report_id)
        snapshot = reference.get()
        if not snapshot.exists:
            raise KeyError(report_id)
        return reference, {"id": snapshot.id, **snapshot.to_dict()}
    else:
        if report_id not in _memory_reports:
            raise KeyError(report_id)
        return MemoryDocRef(report_id), _memory_reports[report_id]


def list_reports(status: str | None = None) -> list[dict[str, Any]]:
    database = db()
    if database is not None:
        query = database.collection("threat_reports")
        if status:
            query = query.where("status", "==", status)
        reports = [{"id": snapshot.id, **snapshot.to_dict()} for snapshot in query.stream()]
        return sorted(reports, key=lambda report: report.get("created_at", ""), reverse=True)
    else:
        reports = list(_memory_reports.values())
        if status:
            reports = [rep for rep in reports if rep.get("status") == status]
        return sorted(reports, key=lambda report: report.get("created_at", ""), reverse=True)


def write_audit(report_id: str, action: str, user: dict[str, Any], details: dict[str, Any] | None = None) -> None:
    database = db()
    audit_entry = {
        "report_id": report_id,
        "action": action,
        "actor_uid": user.get("uid"),
        "actor_email": user.get("email"),
        "created_at": utc_now(),
        "details": details or {},
    }
    if database is not None:
        database.collection("threat_audit").add(audit_entry)
    else:
        _memory_audit.append(audit_entry)

