# FuelChain Prisma

Schema: `prisma/schema.prisma`  
Seed: `prisma/seed.ts` (PHASE 4 — DEMO data)

## Commands (from repo root)

```bash
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

## DEMO batches (seed)

| Code | Risk | Status |
|------|------|--------|
| `FC-BO-2026-000181` | LOW | COMPLETED |
| `FC-BO-2026-000182` | MEDIUM | IN_TRANSIT |
| `FC-BO-2026-000184` | HIGH | AUDIT_REQUIRED |

Batch 3 narrative volumes: Declared 100000 → Received 99900 → Stored 98700 → SIMULATOR 98650.  
ESP32 físico está **diferido**; la medición usa `source=SIMULATOR`.

All seeded rows have `isDemo=true`.
