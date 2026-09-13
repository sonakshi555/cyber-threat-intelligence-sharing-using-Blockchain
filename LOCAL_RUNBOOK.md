# Local Runbook

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

## Start the project tomorrow

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

Copy the printed contract address into `backend/.env`:

```env
CONTRACT_ADDRESS=<newly-deployed-address>
```

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

## Important notes

- Do not start a second Hardhat node while port `8545` is already in use.
- Do not start a second FastAPI process while port `8000` is already in use.
- `http://127.0.0.1:8000/` may show `{"detail":"Not Found"}`. Use `/api/health` or `/docs` instead.
- Restarting the Hardhat node resets its local blockchain, so deploy the contract again and update `backend/.env`.
