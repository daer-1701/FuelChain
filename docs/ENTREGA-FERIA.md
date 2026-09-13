# Checklist IRL — 13 septiembre (cierre 08:30)

## Tracks Devfolio (obligatorio)

URL: https://eag-global-buildathon.devfolio.co/

- [ ] Registrarse / equipo
- [ ] Track **Bolivia Hackathon**
- [ ] Track **Real-World Ethereum Applications**
- [ ] Track **HSK Chain** (RWA)
- [ ] Repo: https://github.com/daer-1701/FuelChain
- [ ] Doc técnica: este checklist + **`docs/SUBMISSION-IRL.md`**
- [ ] README raíz (install + HSK)
- [ ] Demo URL (Vercel + Railway — `docs/DEPLOY.md`) o “local / tunnel”
- [ ] Video ≤ 3 min **o** demo en vivo 10:30–14:30
- [ ] Dirección contrato HSK (testnet OK)

## Foco del pitch

> Cantidad y calidad en cada tramo del camino.  
> No tokenizamos el diésel. Anclamos la evidencia del recorrido en HSK.

## Bloqueante técnico (antes de 08:30)

Hoy el `.env` está en **localhost 31337**. Para el track HSK hace falta:

1. Wallet + faucet testnet: https://hskchain.net/faucet  
2. `.env`: `HSK_TESTNET_RPC_URL`, `BLOCKCHAIN_PRIVATE_KEY` (testnet), luego:

```powershell
pnpm contracts:compile
pnpm contracts:deploy:hsk-testnet
```

3. Pegar address / `CHAIN_ID=133` / explorer en `.env` (ver `docs/hsk-feria.md`)  
4. Reiniciar API → `GET /blockchain/status` → `live: true`  
5. Flujo: chofer QR → estación accept → ANH **Evidencia** → abrir tx

## Guion demo 3 + 2

Ver `docs/SUBMISSION-IRL.md` § Demo Day script.

Credenciales: `chofer@` / `estacion@` / `anh@` · `demo123`

## No priorizar mañana

- Unlock (`/acceso`) — WIP, deadline 18 sep  
- Avalanche / Pollar / Vaquita  

## Docs

| Archivo | Uso |
|---------|-----|
| `docs/SUBMISSION-IRL.md` | Doc técnica Devfolio |
| `docs/hsk-feria.md` | Deploy HSK |
| `docs/demo.md` | Pitch operativo |
| `README.md` | Install + integración |
