# FuelChain

**FuelChain Bolivia** — *Cada litro. Cada movimiento. Cada evidencia.*

Plataforma DEMO de **trazabilidad, reconciliación y auditoría** de combustible importado.

> Abstracción para hackathon. No es un sistema de YPFB, ANH ni Aduana.  
> Blockchain = evidencia tamper-evident, **no** prueba de litros físicos.  
> Anomalías = señales para auditoría humana. La IA explica; no decide fraude.

## Stack

| Capa | Tecnología |
|------|------------|
| Monorepo | pnpm + Turborepo |
| Web | Next.js (`apps/web`) |
| API | NestJS (`apps/api`) |
| DB | PostgreSQL + Prisma |
| Chain | Solidity + Hardhat + viem |
| IoT | MQTT / simulador (ESP32 diferido) |

## Quick start

```bash
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed

pnpm --filter @fuelchain/api dev   # :3001
pnpm --filter @fuelchain/web dev   # :3000
```

### Blockchain en vivo (opcional)

```bash
pnpm contracts:node
pnpm contracts:compile
pnpm --filter @fuelchain/contracts run deploy
```

Configura `FUELCHAIN_CONTRACT_ADDRESS` y `BLOCKCHAIN_PRIVATE_KEY` (cuenta #0 Hardhat) en `.env`. Ver `.env.example` y `docs/demo.md`.

## URLs

| Servicio | URL |
|----------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Health | http://localhost:3001/health |
| Lote demo | http://localhost:3000/batches/FC-BO-2026-000184 |
| Evidencia | http://localhost:3000/blockchain |

## Documentación

- [`docs/Informe_FuelChain_Bolivia.docx`](docs/Informe_FuelChain_Bolivia.docx) — informe completo
- [`docs/architecture.md`](docs/architecture.md) — arquitectura
- [`docs/demo.md`](docs/demo.md) — guía de uso y guion de jurado
- [`docs/bolivia-fuel-process.md`](docs/bolivia-fuel-process.md) — proceso BO (oficial vs DEMO)

## Regla de paquetes

Usa **siempre** `pnpm`. No `npm` / `npx`.
