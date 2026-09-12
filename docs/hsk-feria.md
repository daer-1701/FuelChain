# FuelChain × HSK Chain — integración para Ethereum Bolivia 2026

**Pitch en una frase:** no tokenizamos el diésel; anclamos la **evidencia del recorrido** (cantidad/calidad del camino) en HSK para que sea verificable.

## Qué hace on-chain

Al aceptar un bastón QR (`RECEIVED`), la API intenta `anchorCustodyReceivedBestEffort`:

1. Calcula un hash canónico del evento de custodia.
2. Escribe en el contrato `FuelChain` (Solidity).
3. Guarda `transactionHash` / `blockNumber` en `blockchain_anchors`.

Si el nodo no está disponible, la recepción **igual se completa** y el ancla queda `PENDING`. Eso es intencional: la operación física no depende de la chain.

## Redes

| Red | Chain ID | Uso |
|-----|----------|-----|
| Hardhat local | 31337 | Desarrollo |
| HSK Testnet | 133 | Demo pública segura |
| HSK Mainnet | 177 | Solo si el track de la feria lo exige |

## Deploy testnet (recomendado para ensayos)

```powershell
# .env (no commitear)
# HSK_TESTNET_RPC_URL=https://testnet.hsk.xyz
# HSK_TESTNET_CHAIN_ID=133
# BLOCKCHAIN_PRIVATE_KEY=<clave testnet con gas>

pnpm contracts:compile
pnpm contracts:deploy:hsk-testnet
```

Copiá al `.env` lo que imprime el script:

```env
FUELCHAIN_CONTRACT_ADDRESS=0x...
CHAIN_RPC_URL=https://testnet.hsk.xyz
CHAIN_ID=133
NEXT_PUBLIC_CHAIN_ID=133
NEXT_PUBLIC_FUELCHAIN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://testnet-explorer.hsk.xyz
BLOCKCHAIN_PRIVATE_KEY=...   # solo backend
```

Reiniciá la API. Comprobá: `GET /blockchain/status` → `live: true`.

## Deploy mainnet (solo feria / track)

⚠️ Requiere fondos reales y clave dedicada. Nunca Hardhat account #0.

```powershell
# ALLOW_HSK_MAINNET=1
# HSK_MAINNET_RPC_URL=...
# BLOCKCHAIN_PRIVATE_KEY=<clave mainnet>
# CHAIN_ID=177

pnpm contracts:deploy:hsk-mainnet
```

El script **rechaza** mainnet salvo `ALLOW_HSK_MAINNET=1`.

## Demo de 3 minutos (jurado)

1. Login `chofer@` → emitir QR (`/verify`) con lote + estación + calidad.
2. Login `estacion@` → abrir `/q/BT-…` → litros + densidad/temp/agua → Aceptar.
3. Mostrar en UI: evidencia / txHash → abrir explorador HSK.
4. Opcional: `/liquidaciones` → liquidación DEMO del chofer (Bs).
5. Frase cierre: *“Blockchain = evidencia verificable; no prueba el litro físico.”*

## Checklist entrega track HSK (IRL 13 sep)

- [ ] Contrato en HSK **testnet** (o mainnet si alcanza)
- [ ] `GET /blockchain/status` → live
- [ ] Flujo accept → txHash visible (ANH → Evidencia)
- [ ] Repo GitHub público
- [ ] Devfolio: Bolivia + Real-World + HSK RWA
- [ ] Doc: `docs/SUBMISSION-IRL.md`
- [ ] Demo / video
- [ ] Dirección del contrato en el formulario

## Seguridad

- Nunca pongas `BLOCKCHAIN_PRIVATE_KEY` en `NEXT_PUBLIC_*`.
- No reutilices la clave de chain como `AUTH_SECRET` o `CUSTODY_QR_SECRET`.
- No commits de `.env`.
