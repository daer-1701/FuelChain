# Deploy FuelChain — feria (público)

Stack elegido: **Railway** (API + Postgres) + **Vercel** (web Next.js).  
Contrato HSK ya está en testnet (`0x2b5e1090462e2be693F75b5F54d39160b3E99066`).

```text
Ciudadano / jurado
  → Vercel (apps/web)
  → Railway API (apps/api) + Postgres
  → HSK testnet (evidencia)
```

## 1. Railway — API + DB

1. https://railway.app → **New Project** → **Deploy from GitHub** → `daer-1701/FuelChain`
2. En el servicio del repo: Settings → Builder = **Dockerfile**, path `Dockerfile.api` (o usa [`railway.toml`](../railway.toml))
3. **+ New** → **Database** → **PostgreSQL**
4. En el servicio API → Variables → Reference `DATABASE_URL` desde Postgres
5. Agregá el resto (ver tabla abajo). **No** subas `.env` al repo.
6. Deploy → abrí la URL pública (`https://….up.railway.app`)
7. Una sola vez (seed DEMO):

```bash
railway run pnpm db:seed
```

Health: `GET https://<api>/health` → `"database":"up"`.

### Variables API (Railway)

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `NODE_ENV` | `production` |
| `API_PORT` | `3001` (o el que asigne Railway vía `PORT`) |
| `API_CORS_ORIGIN` | `https://<tu-app>.vercel.app` (coma-separado si hay varios) |
| `AUTH_SECRET` | secreto fuerte (no el de blockchain) |
| `CUSTODY_QR_SECRET` | otro secreto fuerte |
| `CHAIN_RPC_URL` | `https://testnet.hsk.xyz` |
| `CHAIN_ID` | `133` |
| `FUELCHAIN_CONTRACT_ADDRESS` | `0x2b5e1090462e2be693F75b5F54d39160b3E99066` |
| `BLOCKCHAIN_PRIVATE_KEY` | clave **testnet** con gas (solo backend) |
| `NEXT_PUBLIC_BLOCK_EXPLORER_URL` / `BLOCK_EXPLORER_URL` | `https://testnet-explorer.hsk.xyz` |

`PORT` lo inyecta Railway; el API ya lee `PORT` o `API_PORT` y escucha en `0.0.0.0`.

## 2. Vercel — Web

1. https://vercel.com/new → Import `daer-1701/FuelChain`
2. **Root Directory:** `apps/web` (usa [`apps/web/vercel.json`](../apps/web/vercel.json))
3. Framework: Next.js
4. Variables **antes del build** (se embeben en el cliente):

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://<api>.up.railway.app` (sin `/` final) |
| `NEXT_PUBLIC_APP_NAME` | `FuelChain Bolivia` |
| `NEXT_PUBLIC_CHAIN_ID` | `133` |
| `NEXT_PUBLIC_FUELCHAIN_CONTRACT_ADDRESS` | `0x2b5e1090462e2be693F75b5F54d39160b3E99066` |
| `NEXT_PUBLIC_BLOCK_EXPLORER_URL` | `https://testnet-explorer.hsk.xyz` |

5. Deploy → copiá la URL (`https://….vercel.app`)
6. Volvé a Railway y actualizá `API_CORS_ORIGIN` con esa URL → redeploy API

## 3. Checklist feria

- [ ] `GET /health` OK
- [ ] `GET /blockchain/status` → `live: true`
- [ ] Login `chofer@` / `estacion@` / `anh@` · `demo123`
- [ ] Chofer emite → estación recibe → ANH Evidencia → tx en explorer
- [ ] Pegar URL web + contrato en Devfolio

## CLI (opcional)

```powershell
pnpm dlx @railway/cli login
pnpm dlx @railway/cli link
pnpm dlx @railway/cli up

pnpm dlx vercel login
pnpm dlx vercel --cwd apps/web
```

## No hacer

- Commitear `.env` / private keys
- Poner `BLOCKCHAIN_PRIVATE_KEY` en `NEXT_PUBLIC_*`
- Redeploy seed en cada release (borra datos de demo en vivo)
