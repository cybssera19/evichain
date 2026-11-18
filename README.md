# EviChain

A wallet-based application for tracking digital evidence and chain of custody.

## Run locally

Works on Linux, macOS, Windows, and WSL. Requires Node.js 22.12 or newer, npm, Docker with Docker Compose, and MetaMask. Start the Docker engine before launching the application. On WSL, enable Docker Desktop integration for your distribution, or use a Docker Engine installed inside WSL. PowerShell is not required.

```sh
npm ci
npm run start:local
```

Open **http://127.0.0.1:5173**. Startup launches PostgreSQL, Hardhat, the API, and the frontend. It deploys contracts and creates `.env` when needed. It also checks frontend compilation (output in `.local/frontend-check/`) before reporting that the application is ready.

The Node.js launcher reuses services that are already running and leaves newly started services running in the background. Their logs are in `.local/chain.*.log`, `.local/api.*.log`, and `.local/web.*.log`. If startup reports that Docker is inaccessible, check `docker info` and `docker compose version` in the same terminal.

## Sign in

1. Click **Add / select local network**. RPC: `http://127.0.0.1:8545`. Chain ID: `31337`.
2. Connect MetaMask and sign the login message. Signing in does not cost gas.
3. New users enter their profile and request Investigator, Analyst, or Auditor access. An Admin approves the role. Sign in again after approval.

For the local Admin account, run `npm run admin:local`. Import the displayed development key into MetaMask and sign in. This publicly known account is for local development only. Never use it for real funds or public deployments.

## Run on Sepolia

To run against the public testnet instead of the local chain:

1. Get a Sepolia RPC URL (e.g. Alchemy) and a funded test wallet. Set `SEPOLIA_RPC_URL` and `DEPLOYER_KEY` in `.env`, then deploy:

```powershell
npx hardhat run scripts/deploy.cjs --network sepolia
```

2. In `.env`, set `CHAIN_ID=11155111`, point `RPC_URL`/`VITE_RPC_URL` at a Sepolia endpoint, and fill `CONTRACT_ADDRESS`/`ROLE_CONTRACT_ADDRESS` and their `VITE_` counterparts with the printed addresses. Use a public RPC for `VITE_RPC_URL` so the provider key stays out of the browser bundle.

3. Start the services manually — not `start:local`, which targets the local chain:

```powershell
docker compose up -d postgres
npm run api
npm run dev
```

4. In MetaMask, select the **Sepolia** network and sign in. Each acting wallet needs Sepolia test ETH from a faucet, and transactions take a few seconds to confirm.

## Roles and workflow

| Role | Access |
| --- | --- |
| Admin | Assign roles, manage cases, void evidence, and recover custody after a holder loses access |
| Investigator | Register evidence, update held evidence, transfer custody, and release or dispose of evidence |
| Analyst | Record analysis and transfer held evidence |
| Auditor | View cases and evidence, inspect history, and verify file hashes |

Evidence registration requires a case under Investigation. Filing blocks new registrations. A case can close only when it has no active evidence. Cases that have held evidence cannot be deleted; deleted case IDs cannot be reused. Voiding evidence preserves its hash and history.

Assigned roles share case visibility. Custody transfers are authorized by the current holder. On-chain records remain publicly readable independently of the application's roles.

## Storage

| Component | Stores or enforces |
| --- | --- |
| `RoleRegistry` | Wallet roles, role versions, and protection of the last Admin |
| `CaseRegistry` | Case lifecycle, metadata commitments, and evidence counts |
| `EvidenceRegistry` | Evidence hashes, holders, status, and custody actions |
| `CustodyLedger` | Append-only custody history inherited by `EvidenceRegistry` |
| PostgreSQL | Profiles, case descriptions, and file metadata |
| `server/private-files/` | Original evidence files, up to 25 MB each |

Case changes require an on-chain transaction before the matching description is saved. File uploads follow evidence registration and can be retried from the evidence detail screen. Role changes invalidate existing sessions.

Build the frontend with `npm run build`. Startup applies `server/schema.sql` to upgrade existing databases.

## Deployment

For Sepolia, set `SEPOLIA_RPC_URL` and `DEPLOYER_KEY` in `.env`, then run:

```sh
npx hardhat run scripts/deploy.cjs --network sepolia
```

The deploying wallet becomes Admin. Configure the printed RoleRegistry and EvidenceRegistry addresses, RPC URLs, and chain ID using `.env.example`. EvidenceRegistry creates its CaseRegistry automatically. Keep `.env`, private keys, and uploaded files out of Git.

For public hosting, set `NODE_ENV=production` and use HTTPS with a same-site frontend/API. Sessions currently use one API process; restarting it logs users out. Use a shared atomic session store before adding workers. Local services bind to loopback by default.

For an empty local v1 instance, `npm run upgrade:local` deploys v2 and preserves role assignments. Existing evidence or case/file records require a migration plan. The command archives the previous configuration under `.local/deployments` and leaves an existing v2 deployment unchanged.
