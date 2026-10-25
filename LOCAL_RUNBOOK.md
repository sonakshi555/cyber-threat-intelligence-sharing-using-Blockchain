# Local Runbook & Operations Manual

This runbook provides comprehensive instructions for configuring, operating, debugging, and deploying the **CTI / ANCHOR** decentralized cyber threat intelligence platform locally on **Windows (PowerShell)** and **Linux / WSL**.

---

## 🧭 Architectural Modes

Before running the application, determine which blockchain mode fits your current task:

| Mode | Persistence | Requirement | Typical Use Case |
| :--- | :--- | :--- | :--- |
| **Sepolia Testnet (Production)** | Full (Immutable on Ethereum) | Sepolia RPC endpoint + funded wallet with Sepolia ETH | End-to-end testing, live demos, presentation |
| **Local Hardhat (Development)** | Resets on process termination | None (runs entirely on local `127.0.0.1:8545`) | Fast offline feature testing, smart contract development |
| **Simulated Fallback** | In-Memory (clears on API restart) | None (automatic fallback when node is offline) | Quick frontend testing without blockchain setup |

---

## 🛑 Clean Process Shutdown & Port Clearing

The application uses three default ports:
- **Port `8545`**: Hardhat local JSON-RPC node
- **Port `8000`**: FastAPI Python backend
- **Port `5173`**: Vite React development server

### On Linux / macOS / WSL:
```bash
# Stop any processes occupying application ports
fuser -k 8545/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true

# Verify ports are clear
ss -ltn | grep -E ':8545|:8000|:5173' || echo "All ports are free"
```

### On Windows PowerShell:
```powershell
# Check for occupying processes
Get-NetTCPConnection -LocalPort 8545,8000,5173 -ErrorAction SilentlyContinue | Select-Object LocalPort,OwningProcess

# Kill process on port 8000 (example):
# Stop-Process -Id <PID> -Force
```

---

## 💻 Workflow 1: Local Hardhat Node Development

Use this workflow to test smart contract logic and ledger updates locally without spending testnet gas.

Open three separate terminals from the project root (`c:\Users\Sonakshi\Documents\cti` or `~/cti` in WSL):

### Terminal 1: Hardhat Blockchain Node
```bash
cd contracts
npm install
node node_modules/hardhat/internal/cli/cli.js node
```
*Leave this terminal running. It generates 20 local test accounts pre-funded with 10,000 ETH on `http://127.0.0.1:8545`.*

### Terminal 2: Deploy Contracts & Auto-Sync
In a second terminal:
```bash
cd contracts
node node_modules/hardhat/internal/cli/cli.js compile
node node_modules/hardhat/internal/cli/cli.js run scripts/deploy.js --network localhost
```
*The `deploy.js` script automatically updates `backend/.env` with the new `CONTRACT_ADDRESS`.*

### Terminal 3: FastAPI Backend
```bash
cd backend
python -m venv .venv

# On Linux/WSL:
source .venv/bin/activate
# On Windows PowerShell:
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Verify the backend:
```bash
curl http://127.0.0.1:8000/api/health
```
Expected response:
```json
{"status": "ok"}
```

### Terminal 4: Vite React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL printed in your console (typically `http://localhost:5173`).

---

## 🌐 Workflow 2: Persistent Ethereum Sepolia Mode

Use Sepolia when you want reports, threat signatures, and CTIX rewards to persist permanently across restarts and be verifiable on [Sepolia Etherscan](https://sepolia.etherscan.io).

### Step 1: Configure Sepolia RPC & Deployer Wallet
1. Obtain a Sepolia RPC URL from [Infura](https://infura.io) or [Alchemy](https://alchemy.com):
   `https://sepolia.infura.io/v3/<YOUR_API_KEY>`
2. Create a dedicated test wallet (e.g. MetaMask) and claim free testnet ETH from a Sepolia faucet (e.g. `sepoliafaucet.com` or `cloud.google.com/application/web3/faucet/ethereum/sepolia`).
3. Set your credentials in `contracts/.env`:
   ```env
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR_KEY>
   DEPLOYER_PRIVATE_KEY=0x<YOUR_PRIVATE_KEY>
   ```

### Step 2: Compile & Deploy to Sepolia
```bash
cd contracts
npm install
npm run compile
npm run deploy:sepolia
```
*Take note of the deployed contract addresses printed in the terminal.*

### Step 3: Configure Backend Environment
Edit `backend/.env`:
```env
RPC_URL=https://sepolia.infura.io/v3/<YOUR_KEY>
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
BLOCKCHAIN_PRIVATE_KEY=0x<SAME_TEST_WALLET_PRIVATE_KEY>
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://decentralized-cti.vercel.app
ADMIN_EMAILS=admin@cyberanchor.io,your-email@example.com
```

### Step 4: Daily Startup in Sepolia Mode
*You do **not** need to run Hardhat node or redeploy contracts.* Simply run:

**Terminal 1 (Backend):**
```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 🧠 Interactive Modules & How to Test Locally

### 1. Explainable AI (SHAP Waterfall Attribution)
- Navigate to the **AI & Insights** tab (or inspect any threat card in the **Threat Feed**).
- The SHAP drawer visualizes local feature importance values ($\phi_i$) for tree-based ensemble models.
- Inspect the baseline expectation $E[f(x)]$ and see how individual features (e.g., `packet_rate`, `syn_flood_flags`, `flow_duration`) shifted the classification probability towards malicious ($f(x)$).

### 2. Federated Learning (FedAvg) Consortium Simulator
- Open the **Federated Learning** tab under **AI & Insights**.
- Click **"Initialize Consortium Round"** to run a simulated decentralized model training iteration across 5 institutions (Barclays, CloudScale, NHS Trust, Vodafone, JPMorgan).
- Observe private local gradient generation, hash commitment, and round accuracy convergence without raw telemetry leakage.

### 3. ML Model Evaluation Suite (Confusion Matrix & ROC Curves)
- Move the **Decision Threshold Slider** ($\tau$) between `0.00` and `1.00`.
- Notice how True Positives, False Positives, False Negatives, and True Negatives recalculate in real-time.
- Observe the ROC Curve operating point indicator slide along the high-AUC (0.992) curve.

### 4. Validator Quorum & CTIX Incentive Distribution
- Sign in as an **Admin** user (email matching `ADMIN_EMAILS` or demo toggle).
- Navigate to the **Consensus** tab.
- Click **"Approve & Anchor Threat"** on any pending report.
- The platform triggers the smart contract call, updates the quorum bar to 100%, and increments the submitter's wallet balance by **+25 CTIX tokens**.
- Click on any anchored transaction hash to open the `OnChainProofModal` displaying block height, cryptographic root hash, and gas metrics.

---

## 🔒 Firebase Authentication & Google OAuth

The application supports both Credential (Email/Password) login and Google OAuth.

### Firebase Configuration Setup:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** $\rightarrow$ **Sign-in method** $\rightarrow$ **Email/Password** and **Google**.
3. Under **Authentication** $\rightarrow$ **Settings** $\rightarrow$ **Authorized domains**, ensure the following domains are listed:
   - `localhost`
   - `127.0.0.1`
   - `decentralized-cti.vercel.app`
   - `frontend-bice-two-62.vercel.app`
4. Copy the web config into `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=1:...
   ```
5. Google OAuth uses `prompt: 'select_account'` so users can switch between multiple Google accounts on every sign-in attempt.

---

## 🚀 Production Deployment & Domain Management

### Live Production Endpoints:
- **Primary Domain**: [https://decentralized-cti.vercel.app](https://decentralized-cti.vercel.app)
- **Backend API**: [https://backend-nine-smoky-22.vercel.app](https://backend-nine-smoky-22.vercel.app)

### Edge Canonical Redirect:
In `frontend/vercel.json`, an edge redirect rule is established:
```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "has": [{ "type": "host", "value": "frontend-bice-two-62.vercel.app" }],
      "destination": "https://decentralized-cti.vercel.app/$1",
      "permanent": true
    }
  ]
}
```
Any incoming traffic hitting the legacy `frontend-bice-two-62.vercel.app` domain receives an immediate **`HTTP 308 Permanent Redirect`** directly at Vercel's edge network, preserving all route parameters.

### Deploying Frontend Updates:
```bash
cd frontend
npm run build
.\node_modules\.bin\vercel.cmd --prod --yes
```

### Deploying Backend Updates:
```bash
cd backend
..\frontend\node_modules\.bin\vercel.cmd --prod --yes
```

---

## 🛠️ Common Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `{"detail": "Not Found"}` at `http://localhost:8000/` | Root path has no static handler | Expected behavior; test `/api/health` or open `/docs` for Swagger UI |
| Mode indicates `simulated` instead of `on-chain` | RPC unavailable or wallet out of Sepolia ETH | Check `RPC_URL` and `BLOCKCHAIN_PRIVATE_KEY` in `backend/.env` |
| CORS error in browser console | Origin not in backend whitelist | Confirm `FRONTEND_ORIGINS` in `backend/.env` includes `http://localhost:5173` |
| Google OAuth popup blocked | Browser pop-up blocker or unauthorized domain | Allow popups for localhost and add domain to Firebase Console Authorized Domains |
| Large CSV fails upload | Serverless payload size limit | Ensure `BLOB_READ_WRITE_TOKEN` is configured in Vercel project storage |
