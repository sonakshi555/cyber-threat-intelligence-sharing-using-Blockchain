from __future__ import annotations

import os
import tempfile
import urllib.request
from urllib.parse import urlparse
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .auth import admin_user, current_user
from .blockchain_client import Web3Client
from .pipeline import UnifiedThreatPipeline
from .store import create_report, find_existing_report, get_report, list_reports, write_audit, utc_now

app = FastAPI(title="Cyber Threat Blockchain API", version="1.0.0")
allowed_origins = [origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://frontend-bice-two-62.vercel.app").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, allow_origin_regex=r"https://frontend-[a-z0-9-]+-1da23cs171cs-4002\.vercel\.app", allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
blockchain = Web3Client()
MAX_DATASET_BYTES = 500 * 1024 * 1024


class ReviewPayload(BaseModel):
    solution: str = ""
    review_note: str = ""


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/threat/process-and-anchor")
async def process_and_anchor(org_name: str = Form(...), attack_type: str = Form(...), dataset: UploadFile = File(...), user: dict = Depends(current_user)):
    if not org_name.strip():
        raise HTTPException(status_code=422, detail="Organization name is required")
    if not dataset.filename or Path(dataset.filename).suffix.lower() != ".csv":
        raise HTTPException(status_code=415, detail="Only .csv datasets are accepted")

    temporary_path: str | None = None
    try:
        contents = await dataset.read()
        if not contents:
            raise HTTPException(status_code=400, detail="The uploaded CSV is empty")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as temporary_file:
            temporary_file.write(contents)
            temporary_path = temporary_file.name
        analysis = UnifiedThreatPipeline(temporary_path, attack_type).run()
        existing = find_existing_report(org_name, analysis["report_hash"])
        report_id = existing["id"] if existing else create_report({"organization": org_name, "attack_type": attack_type, **analysis, "submitted_by": user.get("email"), "submitted_by_uid": user.get("uid")})
        if not existing:
            write_audit(report_id, "submitted", user)
        return {"organization": org_name, "attack_type": attack_type, **analysis, "report_id": report_id, "receipt": {"mode": "pending", "tx_hash": "", "block_number": None}}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Unable to process dataset: {exc}") from exc
    finally:
        if temporary_path:
            try:
                os.unlink(temporary_path)
            except OSError:
                pass


@app.post("/api/threat/process-and-anchor-url")
def process_and_anchor_url(org_name: str = Form(...), attack_type: str = Form(...), dataset_url: str = Form(...), filename: str = Form("dataset.csv"), user: dict = Depends(current_user)):
    if not org_name.strip():
        raise HTTPException(status_code=422, detail="Organization name is required")
    parsed_url = urlparse(dataset_url)
    if parsed_url.scheme != "https" or not (parsed_url.hostname or "").endswith("blob.vercel-storage.com"):
        raise HTTPException(status_code=400, detail="Only Vercel Blob HTTPS URLs are accepted")
    if Path(filename).suffix.lower() != ".csv":
        raise HTTPException(status_code=415, detail="Only .csv datasets are accepted")

    temporary_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as temporary_file:
            temporary_path = temporary_file.name
            total_bytes = 0
            request = urllib.request.Request(dataset_url, headers={"Authorization": f"Bearer {os.getenv('BLOB_READ_WRITE_TOKEN', '')}"})
            with urllib.request.urlopen(request, timeout=90) as remote_file:
                while chunk := remote_file.read(1024 * 1024):
                    total_bytes += len(chunk)
                    if total_bytes > MAX_DATASET_BYTES:
                        raise HTTPException(status_code=413, detail="CSV exceeds the 100 MB processing limit")
                    temporary_file.write(chunk)
        analysis = UnifiedThreatPipeline(temporary_path, attack_type).run()
        existing = find_existing_report(org_name, analysis["report_hash"])
        report_id = existing["id"] if existing else create_report({"organization": org_name, "attack_type": attack_type, **analysis, "submitted_by": user.get("email"), "submitted_by_uid": user.get("uid"), "source_filename": filename})
        if not existing:
            write_audit(report_id, "submitted", user)
        return {"organization": org_name, "attack_type": attack_type, **analysis, "report_id": report_id, "receipt": {"mode": "pending", "tx_hash": "", "block_number": None}}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Unable to process Blob dataset: {exc}") from exc
    finally:
        if temporary_path:
            try:
                os.unlink(temporary_path)
            except OSError:
                pass


@app.get("/api/blockchain/ledger")
def get_ledger():
    return {"records": blockchain.ledger()}


@app.get("/api/me")
def get_me(user: dict = Depends(current_user)):
    admin_emails = {email.strip().lower() for email in os.getenv("ADMIN_EMAILS", "").split(",") if email.strip()}
    role = "admin" if user.get("role") == "admin" or user.get("email", "").lower() in admin_emails else "uploader"
    return {"uid": user.get("uid"), "email": user.get("email"), "role": role}


@app.get("/api/reports/pending")
def get_pending_reports(_: dict = Depends(admin_user)):
    return {"reports": list_reports("pending")}


@app.get("/api/reports/approved")
def get_approved_reports(_: dict = Depends(current_user)):
    return {"reports": list_reports("approved")}


@app.post("/api/reports/{report_id}/approve")
def approve_report(report_id: str, payload: ReviewPayload, user: dict = Depends(admin_user)):
    try:
        reference, report = get_report(report_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Report not found") from exc
    if report.get("status") != "pending":
        raise HTTPException(status_code=409, detail="Only pending reports can be approved")
    reference.update({"status": "anchoring", "solution": payload.solution, "review_note": payload.review_note, "reviewed_by": user.get("email"), "reviewed_at": utc_now()})
    receipt = blockchain.anchor(report["organization"], report["attack_type"], report["report_hash"], report["sensitive_data_hash"], report["record_count"])
    if receipt.get("mode") != "on-chain":
        reference.update({"status": "pending", "last_error": "Blockchain transaction did not complete"})
        raise HTTPException(status_code=502, detail="Blockchain anchoring failed; report remains pending")
    reference.update({"status": "approved", "receipt": receipt})
    write_audit(report_id, "approved", user, {"solution": payload.solution, "receipt": receipt})
    return {"report_id": report_id, "status": "approved", "receipt": receipt}


@app.post("/api/reports/{report_id}/reject")
def reject_report(report_id: str, payload: ReviewPayload, user: dict = Depends(admin_user)):
    try:
        reference, report = get_report(report_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Report not found") from exc
    if report.get("status") != "pending":
        raise HTTPException(status_code=409, detail="Only pending reports can be rejected")
    reference.update({"status": "rejected", "review_note": payload.review_note, "reviewed_by": user.get("email"), "reviewed_at": utc_now()})
    write_audit(report_id, "rejected", user, {"review_note": payload.review_note})
    return {"report_id": report_id, "status": "rejected"}


@app.get("/api/dashboard/summary")
def dashboard_summary(_: dict = Depends(current_user)):
    reports = list_reports("approved")
    by_attack: dict[str, int] = {}
    by_company: dict[str, int] = {}
    for report in reports:
        by_attack[report["attack_type"]] = by_attack.get(report["attack_type"], 0) + 1
        by_company[report["organization"]] = by_company.get(report["organization"], 0) + 1
    return {"total_reports": len(reports), "total_companies": len(by_company), "by_attack": by_attack, "by_company": by_company, "reports": reports}
