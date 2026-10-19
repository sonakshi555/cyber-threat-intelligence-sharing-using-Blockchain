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

Open the URL printed by Vite. The frontend uses Firebase Email/Password Authentication. Create an account from the login screen or sign in with an account enabled in Firebase Authentication.

When the local RPC node is unavailable, the API keeps a clearly marked simulated receipt and in-memory ledger entry so the workflow remains testable.

## Use Sepolia instead of the local chain

The local Hardhat node is an in-memory blockchain. Restarting it creates a new chain, so its contract address and all reports disappear. Sepolia is a persistent public Ethereum testnet, so deploy the contract there once and keep using that address.

1. Create a Sepolia RPC endpoint with a provider such as Alchemy or Infura, and get Sepolia ETH for a dedicated test wallet from a faucet.
2. Copy `contracts/.env.example` to `contracts/.env`, fill in `SEPOLIA_RPC_URL` and `DEPLOYER_PRIVATE_KEY`, then run:

	```bash
	cd contracts
	npm install
	npm run compile
	npm run deploy:sepolia
	```

3. Copy the printed contract address into `backend/.env`, using `backend/.env.example` as the template. Set `RPC_URL` to the same Sepolia endpoint and set `BLOCKCHAIN_PRIVATE_KEY` to the wallet private key. The wallet must have Sepolia ETH for each write transaction.
4. Start only the FastAPI and Vite services. Do not start the local Hardhat node or run deployment again unless the contract must be replaced.

The private key is used only by the backend to sign `anchorReport` transactions. Keep both `.env` files out of Git and use a dedicated test wallet, never a wallet holding real funds.

## Approval workflow and administrator setup

Uploads now create a pending Firestore report. They do not call the blockchain. Only an administrator can approve a report, add the reviewed solution, and trigger `anchorReport`. Rejected reports remain off-chain and every review is written to the `threat_audit` collection.

To configure the backend, create a Firebase service-account key from **Firebase Console > Project settings > Service accounts > Generate new private key**. Add the complete JSON as the single-line `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable in the backend deployment. Set `ADMIN_EMAILS` to the comma-separated email addresses allowed to approve reports. Keep the service-account JSON only in backend secrets.

Firestore collections used by the workflow:

- `threat_reports`: pending, approved, rejected, and anchoring report records
- `threat_audit`: submission, approval, and rejection events

The authenticated ledger area contains the administrator approval queue and a visual intelligence dashboard with approved reports by attack vector and company. Raw CSV files are never displayed there.

## Large CSV uploads with Vercel Blob

The frontend uploads selected CSV files directly to Vercel Blob, then sends the Blob URL to FastAPI. This avoids Vercel's serverless request-size limit for large files. Create a Blob store from the Vercel `frontend` project under **Storage**, connect it to the project, and keep the generated `BLOB_READ_WRITE_TOKEN` in the frontend project's environment. No URL copying is required when a user submits a file.

The automatic upload flow supports CSV files up to 100 MB. For local development, use `vercel dev` from `frontend` so the `/api/upload` Vercel function and Blob token are available; plain `npm run dev` does not provide that API route.

## Configure Firebase authentication

1. In the Firebase console, create or select a project.
2. Open **Authentication > Sign-in method** and enable **Email/Password**.
3. Open **Project settings > Your apps**, register a Web app, and copy its configuration values.
4. Create `frontend/.env` from `frontend/.env.example` and fill in the `VITE_FIREBASE_*` values.
5. Set `VITE_API_URL=http://localhost:8000` for local development.
6. Restart Vite after changing `frontend/.env` because Vite reads these values at build/start time.

Firebase web configuration values are intended for browser use. Do not put a Firebase Admin SDK service-account private key in the frontend or in a `VITE_*` variable.

## Deploy the frontend to Vercel

Vercel can host the Vite frontend. The FastAPI backend must be deployed separately on a Python-capable service such as Render, Railway, or Fly.io.

1. Deploy the `backend` directory to the Python host and set its environment variables from `backend/.env`.
2. Set `FRONTEND_ORIGINS` on the backend to the final Vercel URL, for example `https://your-app.vercel.app`.
3. Confirm the deployed API responds at `https://your-api-host.example.com/api/health`.
4. Import the repository into Vercel and set the project root to `frontend`.
5. Use these Vercel environment variables for Preview and Production:

```env
VITE_API_URL=https://your-api-host.example.com
VITE_FIREBASE_API_KEY=your-firebase-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

6. Add the Vercel domain to Firebase **Authentication > Settings > Authorized domains**.
7. Redeploy the Vercel project after saving the variables.

The Vercel frontend will then call the separately deployed FastAPI API. Keep the Sepolia wallet private key only in the backend host's environment, never in Vercel frontend variables.
