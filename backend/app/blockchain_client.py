from __future__ import annotations

import hashlib
import os
import time
from typing import Any

from dotenv import load_dotenv
from web3 import Web3

load_dotenv()

ABI = [
    {
        "inputs": [{"internalType": "string", "name": "organizationName", "type": "string"}, {"internalType": "string", "name": "attackType", "type": "string"}, {"internalType": "bytes32", "name": "reportHash", "type": "bytes32"}, {"internalType": "bytes32", "name": "sensitiveDataHash", "type": "bytes32"}, {"internalType": "uint256", "name": "totalRecordsEvaluated", "type": "uint256"}],
        "name": "anchorReport", "outputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}], "stateMutability": "nonpayable", "type": "function"
    },
    {"inputs": [], "name": "getAllReports", "outputs": [{"components": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {"internalType": "string", "name": "organizationName", "type": "string"}, {"internalType": "string", "name": "attackType", "type": "string"}, {"internalType": "bytes32", "name": "reportHash", "type": "bytes32"}, {"internalType": "bytes32", "name": "sensitiveDataHash", "type": "bytes32"}, {"internalType": "uint256", "name": "timestamp", "type": "uint256"}, {"internalType": "address", "name": "submitter", "type": "address"}, {"internalType": "uint256", "name": "totalRecordsEvaluated", "type": "uint256"}], "internalType": "struct ThreatReportLedger.ReportRecord[]", "name": "", "type": "tuple[]"}], "stateMutability": "view", "type": "function"}
]


class Web3Client:
    def __init__(self):
        self.rpc_url = os.getenv("RPC_URL", "http://127.0.0.1:8545")
        self.address = os.getenv("CONTRACT_ADDRESS", "")
        self.web3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 2}))
        self._fallback_records: list[dict[str, Any]] = []

    @staticmethod
    def _bytes32(value: str) -> bytes:
        return bytes.fromhex(value.removeprefix("0x"))

    def anchor(self, org_name: str, attack_type: str, report_hash: str, sensitive_hash: str, record_count: int) -> dict[str, Any]:
        try:
            if not self.address or not self.web3.is_connected():
                raise ConnectionError("Configured RPC or contract is unavailable")
            account = self.web3.eth.accounts[0]
            contract = self.web3.eth.contract(address=Web3.to_checksum_address(self.address), abi=ABI)
            tx_hash = contract.functions.anchorReport(org_name, attack_type, self._bytes32(report_hash), self._bytes32(sensitive_hash), record_count).transact({"from": account})
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
            return {"mode": "on-chain", "tx_hash": receipt.transactionHash.hex(), "block_number": receipt.blockNumber, "record_id": None}
        except Exception:
            record_id = len(self._fallback_records)
            digest = hashlib.sha256(f"{org_name}:{attack_type}:{report_hash}:{time.time_ns()}".encode()).hexdigest()
            self._fallback_records.append({"id": record_id, "organizationName": org_name, "attackType": attack_type, "reportHash": report_hash, "sensitiveDataHash": sensitive_hash, "timestamp": int(time.time()), "submitter": "simulation", "totalRecordsEvaluated": record_count})
            return {"mode": "simulated", "tx_hash": f"0x{digest}", "block_number": None, "record_id": record_id}

    def ledger(self) -> list[dict[str, Any]]:
        try:
            if self.address and self.web3.is_connected():
                contract = self.web3.eth.contract(address=Web3.to_checksum_address(self.address), abi=ABI)
                records = contract.functions.getAllReports().call()
                return [self._normalize(record) for record in records]
        except Exception:
            pass
        return self._fallback_records

    @staticmethod
    def _normalize(record: Any) -> dict[str, Any]:
        keys = ["id", "organizationName", "attackType", "reportHash", "sensitiveDataHash", "timestamp", "submitter", "totalRecordsEvaluated"]
        return {key: (value.hex() if isinstance(value, bytes) else value) for key, value in zip(keys, record)}
