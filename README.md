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

### Blockchain

**Localhost (desarrollo)**

```powershell
pnpm contracts:node
pnpm contracts:compile
pnpm contracts:deploy
```

En `.env`: `CHAIN_RPC_URL=http://127.0.0.1:8545`, `CHAIN_ID=31337`, `FUELCHAIN_CONTRACT_ADDRESS` del script, `BLOCKCHAIN_PRIVATE_KEY` = cuenta #0 Hardhat (solo local).

**HSK Testnet (demo pública)**

1. Poné en `.env` (no commitear): `HSK_TESTNET_RPC_URL`, `HSK_TESTNET_CHAIN_ID=133` y una `BLOCKCHAIN_PRIVATE_KEY` de testnet con HSK de prueba.
2. Compilá y desplegá vos: `pnpm contracts:deploy:hsk-testnet`
3. Copiá a `.env` lo que imprime el script: `FUELCHAIN_CONTRACT_ADDRESS`, `CHAIN_RPC_URL`, `CHAIN_ID=133`, `NEXT_PUBLIC_*` y `NEXT_PUBLIC_BLOCK_EXPLORER_URL`.
4. Reiniciá la API. El flujo QR → RECEIVED → ancla no cambia.

Nunca uses una clave en `NEXT_PUBLIC_*`. Nunca despliegues a HSK Mainnet (177) con estos scripts.

Valores oficiales de red: [HashKey Developer QuickStart](https://docs.hashkeychain.net/docs/Developer-QuickStart). Detalle en `docs/demo.md`.

Secretos **obligatorios** (fail-fast, sin fallback):

```env
AUTH_SECRET=...
CUSTODY_QR_SECRET=...
```

No reutilices la private key de blockchain como secreto de QR o de sesión. Copiá las claves desde `.env.example` a tu `.env` local (el `.env` no se commitea).

## URLs

| Destino | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API health | http://localhost:3001/health |
| Mapa público | http://localhost:3000/mapa |
| Supervisión ANH | http://localhost:3000/supervision (`anh@` / `demo123`) |
| Mi estación | http://localhost:3000/estacion (`estacion@` / `demo123`) |
| QR custodia | http://localhost:3000/verify (emite; requiere login) |
| Aceptar bastón | http://localhost:3000/q/BT-… (ficha pública; aceptar pide estación) |
| Lote demo | http://localhost:3000/batches/FC-BO-2026-000184 |
| Evidencia | http://localhost:3000/blockchain |

## Documentación

- [`docs/Informe_FuelChain_Bolivia.docx`](docs/Informe_FuelChain_Bolivia.docx)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/demo.md`](docs/demo.md)
- [`docs/bolivia-fuel-process.md`](docs/bolivia-fuel-process.md)

## Regla

Usa **siempre** `pnpm`. No `npm` / `npx`.
