from __future__ import annotations

import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .blockchain_client import Web3Client
from .pipeline import UnifiedThreatPipeline

app = FastAPI(title="Cyber Threat Blockchain API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
blockchain = Web3Client()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/threat/process-and-anchor")
async def process_and_anchor(org_name: str = Form(...), attack_type: str = Form(...), dataset: UploadFile = File(...)):
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
        receipt = blockchain.anchor(org_name, attack_type, analysis["report_hash"], analysis["sensitive_data_hash"], analysis["record_count"])
        return {"organization": org_name, "attack_type": attack_type, **analysis, "receipt": receipt}
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


@app.get("/api/blockchain/ledger")
def get_ledger():
    return {"records": blockchain.ledger()}
