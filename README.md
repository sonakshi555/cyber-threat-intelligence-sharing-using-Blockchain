# Cyber Threat Blockchain

A local-first Cyber Threat Intelligence application that evaluates uploaded CSV incident logs and anchors report fingerprints to an EVM ledger.

## Run locally

### 1. Smart contract

```bash
cd contracts
npm install
node node_modules/hardhat/internal/cli/cli.js node
# In a second terminal:
node node_modules/hardhat/internal/cli/cli.js compile
node node_modules/hardhat/internal/cli/cli.js run scripts/deploy.js --network localhost
```

Copy the deployed address into `backend/.env` as `CONTRACT_ADDRESS`.

### 2. FastAPI

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Vite

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite. The demo login accepts any email and password; choose Admin or Uploader to simulate the two roles.

When the local RPC node is unavailable, the API keeps a clearly marked simulated receipt and in-memory ledger entry so the workflow remains testable.
