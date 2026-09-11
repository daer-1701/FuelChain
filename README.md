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
| IoT | Simulador MQTT (ESP32 diferido) |

## Arranque rápido

```powershell
docker compose up -d postgres
pnpm install
pnpm db:migrate
pnpm db:seed

# Opción A — un script (abre ventanas)
pnpm demo:up

# Opción B — manual
pnpm --filter @fuelchain/api dev    # :3001
pnpm --filter @fuelchain/web dev    # :3000
```

### Blockchain en vivo

```powershell
pnpm contracts:node
pnpm contracts:compile
pnpm --filter @fuelchain/contracts run deploy
```

Configura `FUELCHAIN_CONTRACT_ADDRESS` y `BLOCKCHAIN_PRIVATE_KEY` (cuenta #0 Hardhat) en `.env`. Ver `.env.example`.

## URLs

| Destino | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API health | http://localhost:3001/health |
| Lote demo | http://localhost:3000/batches/FC-BO-2026-000184 |
| Evidencia | http://localhost:3000/blockchain |

## Documentación

- [`docs/Informe_FuelChain_Bolivia.docx`](docs/Informe_FuelChain_Bolivia.docx)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/demo.md`](docs/demo.md)
- [`docs/bolivia-fuel-process.md`](docs/bolivia-fuel-process.md)

## Regla

Usa **siempre** `pnpm`. No `npm` / `npx`.
