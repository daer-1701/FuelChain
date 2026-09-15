# FuelChain

**FuelChain Bolivia** — *Quantity and quality at every stretch of the road.*

DEMO platform for **fuel journey traceability**: verify liters and quality from departure through to the pump.

> Hackathon abstraction. Not a YPFB, ANH, or Customs system.  
> Blockchain = tamper-evident evidence of the route, **not** proof of physical liters.  
> Anomalies = signals for human audit. AI explains; it does not decide fraud.

## Stack

| Layer | Technology |
|------|------------|
| Monorepo | pnpm + Turborepo |
| Web | Next.js (`apps/web`) |
| API | NestJS (`apps/api`) |
| DB | PostgreSQL + Prisma |
| Chain | Solidity + Hardhat + viem |
| IoT | MQTT simulator (ESP32 deferred) |

## Quick start

```powershell
docker compose up -d postgres
pnpm install
pnpm db:migrate
pnpm db:seed

# Option A — one script (opens windows)
pnpm demo:up

# Option B — manual
pnpm --filter @fuelchain/api dev    # :3001
pnpm --filter @fuelchain/web dev    # :3000
```

### Blockchain

**Localhost (development)**

```powershell
pnpm contracts:node
pnpm contracts:compile
pnpm contracts:deploy
```

In `.env`: `CHAIN_RPC_URL=http://127.0.0.1:8545`, `CHAIN_ID=31337`, `FUELCHAIN_CONTRACT_ADDRESS` from the script, `BLOCKCHAIN_PRIVATE_KEY` = Hardhat account #0 (local only).

**HSK Testnet (public demo)**

1. Set in `.env` (do not commit): `HSK_TESTNET_RPC_URL`, `HSK_TESTNET_CHAIN_ID=133`, and a testnet `BLOCKCHAIN_PRIVATE_KEY` with test HSK.
2. Compile and deploy yourself: `pnpm contracts:deploy:hsk-testnet`
3. Copy into `.env` what the script prints: `FUELCHAIN_CONTRACT_ADDRESS`, `CHAIN_RPC_URL`, `CHAIN_ID=133`, `NEXT_PUBLIC_*`, and `NEXT_PUBLIC_BLOCK_EXPLORER_URL`.
4. Restart the API. The QR → RECEIVED → anchor flow does not change.

Never put a private key in `NEXT_PUBLIC_*`. Never deploy to HSK Mainnet (177) with these scripts.

Official network values: [HashKey Developer QuickStart](https://docs.hashkeychain.net/docs/Developer-QuickStart).  
Fair / HSK track guide: **`docs/hsk-feria.md`**.  
**IRL delivery Sep 13:** **`docs/SUBMISSION-IRL.md`** + **`docs/ENTREGA-FERIA.md`**.  
Demo details: `docs/demo.md`.

**HSK Mainnet (only if the track requires it):**

```powershell
# ALLOW_HSK_MAINNET=1 + HSK_MAINNET_RPC_URL + key with gas
pnpm contracts:deploy:hsk-mainnet
```

**Required** secrets (fail-fast, no fallback):

```env
AUTH_SECRET=...
CUSTODY_QR_SECRET=...
```

Do not reuse the blockchain private key as the QR or session secret. Copy keys from `.env.example` into your local `.env` (`.env` is not committed).

## URLs

| Destination | URL |
|-------------|-----|
| Web | http://localhost:3000 |
| API health | http://localhost:3001/health |
| Public map | http://localhost:3000/mapa |
| ANH supervision | http://localhost:3000/supervision (`anh@` / `demo123`) |
| My station | http://localhost:3000/estacion (`estacion@` / `demo123`) |
| Custody QR | http://localhost:3000/verify (issues; requires login) |
| Accept baton | http://localhost:3000/q/BT-… (public card; accept requires station) |
| Demo batch | http://localhost:3000/batches/FC-BO-2026-000184 |
| Evidence | http://localhost:3000/blockchain |

## Deploy (fair)

Railway (API + Postgres) + Vercel (web): **[`docs/DEPLOY.md`](docs/DEPLOY.md)**.

## Documentation

- [`docs/Informe_FuelChain_Bolivia.docx`](docs/Informe_FuelChain_Bolivia.docx)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/demo.md`](docs/demo.md)
- [`docs/DEPLOY.md`](docs/DEPLOY.md)
- [`docs/bolivia-fuel-process.md`](docs/bolivia-fuel-process.md)
