# FuelChain Bolivia — Technical documentation (Devfolio / Demo Day)

**Event:** ETH Bolivia Buildathon · Cochabamba · Submission **13 Sep 08:30**  
**Demo:** 5 min (3 showcase + 2 Q&A)

## Tracks to select on Devfolio

1. **Bolivia Hackathon** (mandatory for IRL)
2. **Real-World Ethereum Applications** (EAG primary fit)
3. **HSK Chain** → **RWA** (and/or Blockchain Infrastructure)

Submit at: https://eag-global-buildathon.devfolio.co/

---

## One-liner

> We do **not** tokenize diesel. We anchor **path evidence** (quantity + quality along the journey) on **HSK Chain** so regulators and citizens can verify the trail.

**Tagline:** Cantidad y calidad en cada tramo del camino.

## Problem (Bolivia / Latam)

Last-mile fuel distribution lacks a shared, auditable record of **who carried what, along which route, with what measured quantity and quality**, from load to station reception. Spreadsheets and siloed systems do not give ANH, stations, drivers, and citizens the same operational truth.

## Solution

**FuelChain** is a DEMO abstraction (not YPFB/ANH official software) with four actors:

| Actor | Role | Job |
|-------|------|-----|
| Chofer | `TRANSPORTER` | Open trip (QR + load qty/quality); write GPS path checkpoints |
| Estación | `STATION_STAFF` | Receive via QR; measure qty/quality; scoped to own EESS |
| ANH | `VERIFIER` | Verify network movements + path + on-chain evidence |
| Ciudadano | public `/mapa` | See quantity + quality result at the pump |

## Why HSK / RWA

- **RWA angle:** the “asset” is not a fuel token — it is **verifiable evidence of a real-world fuel movement** (custody event + path measurements).
- On accept (`RECEIVED`), the API best-effort anchors a canonical hash on the `FuelChain` Solidity contract (HSK testnet or mainnet).
- Ops continue if the chain is down (`PENDING` anchor). Blockchain ≠ physical liter proof.

## Core architecture

```text
Chofer (/verify, /tramos)
  → Custody QR + RouteCheckpoint (qty/quality/GPS)
  → Estación (/q) accept + measure
  → Nest API + Prisma/Postgres
  → viem → FuelChain.sol on HSK
  → ANH (/supervision, /blockchain) + citizen (/mapa)
```

| Layer | Tech |
|-------|------|
| Web | Next.js (`apps/web`) |
| API | NestJS (`apps/api`) |
| DB | PostgreSQL + Prisma |
| Chain | Solidity + Hardhat + viem · **HSK** |
| Demo actors | Seed users `*@fuelchain.bo` / `demo123` |

## Key features

1. **Path traceability** — checkpoints: departure → route → arrival with liters + density/temp/water.
2. **Two-actor custody** — driver issues QR; station accepts (no auto-accept on simulate).
3. **Quantity + quality** at load and at reception (station does not invent load quality).
4. **HSK evidence** — custody received event anchored; explorer link when live.
5. **Public map** — citizen-facing availability + quality signal (DEMO).

## How to run

```powershell
docker compose up -d postgres
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm demo:up
```

- Web: http://localhost:3000  
- API: http://localhost:3001/health  

HSK deploy steps: **`docs/hsk-feria.md`**. Pitch script: **`docs/demo.md`**.

## Demo Day script (3 minutes)

1. **Problem (20s)** — Path opacity; need qty/quality verification along the route.  
2. **Chofer (50s)** — `/verify` QR with load quality → `/tramos` checkpoint.  
3. **Estación (50s)** — `/q/BT-…` measure + accept.  
4. **ANH + HSK (40s)** — `/supervision` + `/blockchain` → tx on HSK explorer.  
5. **Close (20s)** — “Evidence of the journey on HSK — not a diesel token.”

## Roadmap (post-hackathon)

- HSK mainnet + explorer UX polish  
- Hardware / IoT tank meters (today: DEMO measurements)  
- Stronger discrepancy rules for human audit  
- Optional membership gate for regulator reports (Unlock — later)

## Credentials DEMO

| Actor | Email | Pass |
|-------|-------|------|
| Chofer | chofer@fuelchain.bo | demo123 |
| Estación | estacion@fuelchain.bo | demo123 |
| ANH | anh@fuelchain.bo | demo123 |
| Ciudadano | `/mapa` (no login) | — |

## Repo

https://github.com/daer-1701/FuelChain
