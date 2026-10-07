# Local Runbook

## Choose a blockchain mode

Use one of these modes before starting the application:

- **Sepolia:** recommended when reports must survive restarts. The deployed contract and anchored report metadata remain on the Sepolia testnet.
- **Local Hardhat:** useful for development. Restarting the Hardhat node resets the blockchain, so all local reports disappear and the contract must be deployed again.
- **Simulated fallback:** used automatically when the RPC or contract is unavailable. The API remains usable, but records are kept only in backend memory and are not on-chain.

The application does not upload the raw CSV to the blockchain. It stores the organization, attack type, record count, report hash, sensitive-data hash, timestamp, and submitter address. The frontend displays these ledger records through the backend API.

## Stop the local services

Use `Ctrl+C` in each terminal running a service:

1. Hardhat node on port `8545`
2. FastAPI on port `8000`
3. Vite frontend, usually on port `5173`

If a terminal is closed and a port is still occupied, run:

```bash
# Stop the Hardhat node
fuser -k 8545/tcp 2>/dev/null || true

# Stop FastAPI and its reload process
fuser -k 8000/tcp 2>/dev/null || true

# Stop Vite if needed
fuser -k 5173/tcp 2>/dev/null || true
```

Confirm that the ports are free:

```bash
ss -ltn | grep -E ':8545|:8000|:5173' || echo "All local service ports are free"
```

## Local Hardhat workflow

Open three WSL terminals from the project root: `/home/sonu/cti`.

### Terminal 1: Hardhat blockchain

```bash
cd ~/cti/contracts
node node_modules/hardhat/internal/cli/cli.js node
```

Leave this terminal running.

### Terminal 2: Deploy the contract

In a second terminal:

```bash
cd ~/cti/contracts
node node_modules/hardhat/internal/cli/cli.js compile
node node_modules/hardhat/internal/cli/cli.js run scripts/deploy.js --network localhost
```

The deployment script automatically updates `backend/.env` with the new contract address.

The address can change whenever the Hardhat node is restarted.

### Terminal 3: FastAPI backend

```bash
cd ~/cti/backend
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Verify it:

```bash
curl http://127.0.0.1:8000/api/health
```

Expected response:

```json
{"status":"ok"}
```

### Terminal 4: React frontend

```bash
cd ~/cti/frontend
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Persistent Sepolia setup

Use Sepolia when you want the contract and reports to survive local restarts. Sepolia is a public Ethereum testnet, so use a dedicated test wallet only. Never use a wallet that contains real funds.

### 1. Create a Sepolia RPC endpoint

Create a Sepolia endpoint with a provider such as Infura or Alchemy. Keep the endpoint URL private. It normally looks like:

```text
https://sepolia.infura.io/v3/<project-id>
```

### 2. Create and fund a deployment wallet

Create a dedicated test wallet and fund it with Sepolia ETH from a Sepolia faucet. You need the wallet's private key for deployment and backend transaction signing.

Never paste the private key into chat, commit it, or put it in a screenshot.

### 3. Configure Hardhat

In WSL, copy the example file:

```bash
cd ~/cti
cp contracts/.env.example contracts/.env
chmod 600 contracts/.env
nano contracts/.env
```

Set the two values in `contracts/.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<project-id>
DEPLOYER_PRIVATE_KEY=0x<deployment-wallet-private-key>
```

Save the file and return to the shell. Do not commit this file; it is ignored by Git.

### 4. Compile and deploy once

Run:

```bash
cd ~/cti/contracts
npm install
npm run compile
npm run deploy:sepolia
```

The deployment command prints an address similar to:

```text
ThreatReportLedger deployed to: 0x...
```

The deployment script automatically writes the printed address into `backend/.env` when that file already exists. You do not need to copy the address manually. Deploy again only if the contract code changes or the local chain is intentionally replaced.

### 5. Configure the backend

Create the backend environment file only if it does not already exist:

```bash
cd ~/cti
test -f backend/.env || cp backend/.env.example backend/.env
chmod 600 backend/.env
nano backend/.env
```

Set:

```env
RPC_URL=https://sepolia.infura.io/v3/<project-id>
CONTRACT_ADDRESS=0x<deployed-sepolia-contract-address>
BLOCKCHAIN_PRIVATE_KEY=0x<same-wallet-private-key>
```

Use the same RPC endpoint and wallet that were used for deployment. The wallet must retain Sepolia ETH because every report anchor is a blockchain write transaction.

### 6. Start Sepolia mode

Do not start the local Hardhat node. Start only the backend and frontend.

Terminal 1, backend:

```bash
cd ~/cti/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Terminal 2, frontend:

```bash
cd ~/cti/frontend
npm run dev -- --host 0.0.0.0
```

Open:

```text
http://localhost:5173
```

Verify the backend before uploading a report:

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/blockchain/ledger
```

Expected health response:

```json
{"status":"ok"}
```

### 7. Daily startup after deployment

You do not need to run `npm run deploy:sepolia` again. Start only:

```bash
cd ~/cti/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

```bash
cd ~/cti/frontend
npm run dev -- --host 0.0.0.0
```

Redeploy only when the contract code changes or the deployed contract must be replaced. The deployment script updates `CONTRACT_ADDRESS` in `backend/.env`; restart FastAPI afterward so it reloads the new value.

Sepolia is persistent, but it is still a testnet: transactions can take time, the RPC provider can rate-limit requests, and the wallet needs Sepolia ETH for writes.

### 8. Current configured Sepolia deployment

This workspace currently uses the deployed contract:

```text
0xe31baE0021071B004b12449a4C846d90D0AA71D5
```

For normal daily use, do not start Hardhat and do not deploy again. Open two WSL terminals:

Terminal 1, backend:

```bash
cd ~/cti/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Terminal 2, frontend:

```bash
cd ~/cti/frontend
npm run dev -- --host 0.0.0.0
```

Check the configuration before opening the frontend:

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/blockchain/ledger
```

The ledger may initially contain an empty `records` array. After a successful submission, it will contain the on-chain report record.

## Register a threat log

After either local or Sepolia mode is running:

1. Open the Vite URL, usually `http://localhost:5173`.
2. Sign in with the demo login. Select `Admin` or `Uploader`.
3. Select **Process evidence**.
4. Enter an organization name.
5. Select the attack vector.
6. Choose a CSV file and submit it.
7. Wait for analysis and the blockchain transaction to finish.
8. Open **On-chain ledger** or select **Refresh ledger** to view the registered record.

For a successful blockchain write, the response shown by the API contains a receipt like:

```json
{
	"receipt": {
		"mode": "on-chain",
		"tx_hash": "0x...",
		"block_number": 12345678
	}
}
```

The `tx_hash` can be searched on a Sepolia block explorer. A record appearing in the frontend is not by itself proof of persistence; confirm that the receipt says `"mode": "on-chain"`.

Do not submit the same file repeatedly unless duplicate ledger entries are intended. Every successful submission creates a new blockchain record. Restarting the backend or frontend does not create a new record.

## Verify the ledger from the API

With FastAPI running, request the records directly:

```bash
curl http://127.0.0.1:8000/api/blockchain/ledger
```

For Sepolia mode, the response is read from the deployed contract. For local mode, it is read from the current Hardhat node. For simulated mode, it is read from temporary backend memory.

## Important notes

- Do not start a second Hardhat node while port `8545` is already in use.
- Do not start a second FastAPI process while port `8000` is already in use.
- `http://127.0.0.1:8000/` may show `{"detail":"Not Found"}`. Use `/api/health` or `/docs` instead.
- Restarting the Hardhat node resets its local blockchain, so deploy the contract again. The deployment script updates `backend/.env` automatically.
- After changing `backend/.env`, restart FastAPI because the blockchain client reads environment variables when the process starts.
- If a submission returns `"mode": "simulated"`, check the RPC URL, contract address, wallet private key, wallet Sepolia ETH balance, and that the deployed contract is on the same network as `RPC_URL`.
- Keep `contracts/.env` and `backend/.env` out of Git. Never put private keys in `.env.example`, screenshots, commits, or chat messages.

## Firebase login

1. In the Firebase console, create or select a project.
2. Open **Authentication > Sign-in method** and enable **Email/Password**.
3. Register a Web app under **Project settings > Your apps**.
4. In WSL, create the frontend environment file:

```bash
cd ~/cti
cp frontend/.env.example frontend/.env
chmod 600 frontend/.env
nano frontend/.env
```

Set the Firebase web configuration values and keep the local API URL:

```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-firebase-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

Restart Vite after changing these values. The login screen supports creating an account and signing in. Firebase restores the session after a page refresh, and **Sign out** ends the Firebase session.

## Deploy the frontend to Vercel

Vercel hosts the Vite frontend. Deploy FastAPI separately on a Python-capable host such as Render, Railway, or Fly.io.

1. Deploy the `backend` directory to the Python host and configure the existing backend variables from `backend/.env`.
2. Set the backend variable `FRONTEND_ORIGINS` to the final Vercel URL, such as `https://your-app.vercel.app`.
3. Verify the deployed API at `https://your-api-host.example.com/api/health`.
4. Import the repository into Vercel and set the project root to `frontend`.
5. Add these Vercel environment variables for Preview and Production:

```env
VITE_API_URL=https://your-api-host.example.com
VITE_FIREBASE_API_KEY=your-firebase-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

6. Add the Vercel domain under Firebase **Authentication > Settings > Authorized domains**.
7. Redeploy Vercel after saving the variables.

Never put `BLOCKCHAIN_PRIVATE_KEY` or a Firebase Admin service-account key in Vercel frontend variables. Those belong only in the backend environment.

## Approval workflow setup

Report submission now creates a Firestore record with `status=pending`. It does not write to the blockchain. The administrator reviews the report, enters the verified solution, and chooses **Approve & anchor** or **Reject**. Only approval calls `anchorReport`.

In the Firebase console:

1. Enable Firestore Database.
2. Open **Project settings > Service accounts** and generate a new private key.
3. Add the complete service-account JSON as `FIREBASE_SERVICE_ACCOUNT_JSON` in the backend Vercel project.
4. Set `ADMIN_EMAILS` to the administrator email address or comma-separated addresses.
5. Add the backend variables for Production and redeploy the backend.

The backend uses these Firestore collections:

```text
threat_reports: pending, approved, rejected, and anchoring reports
threat_audit: submission, approval, and rejection audit events
```

After signing in, an administrator sees **Approval queue** and **Intelligence** tabs inside the ledger area. Other authenticated users can submit evidence and view approved intelligence, but cannot approve or anchor reports.

## Large CSV uploads with Vercel Blob

The frontend handles large files automatically:

```text
Choose CSV -> upload to Vercel Blob -> send Blob URL to FastAPI -> process -> anchor hashes
```

In the Vercel `frontend` project:

1. Open **Storage** and create a **Blob** store.
2. Connect the store to the `frontend` project.
3. Confirm that Vercel adds `BLOB_READ_WRITE_TOKEN` to the project environment.
4. Make sure it is available for **Production**.
5. Redeploy the frontend.

The application accepts CSV files up to 100 MB and sends the Blob URL to `/api/threat/process-and-anchor-url`. Users do not manually copy or paste Blob URLs. The backend downloads the file, processes it, anchors the hashes, and removes its temporary copy.

For local development, run `vercel dev` from `frontend` instead of only `npm run dev`; the Blob upload function is located at `frontend/api/upload.js`.
