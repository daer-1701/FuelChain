# Guía FuelChain Bolivia — demo pitch (4 actores)

**Tagline:** Cada litro. Cada movimiento. Cada evidencia.  
**Importante:** contenido **DEMO / FUELCHAIN ABSTRACTION**. No es un sistema de YPFB, ANH ni Aduana.

Producto confirmado: **Estación · Chofer · ANH · Ciudadano**.  
Legacy (importador / depósito / lab / auditor) existe en DB pero **no** se promociona en el pitch.

---

## 1. Arrancar

```powershell
docker compose up -d postgres
pnpm db:seed
pnpm demo:up
```

| Servicio | URL |
|----------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Health | http://localhost:3001/health → `"database":"up"` |

Blockchain local (incluido en `demo:up`):

```powershell
pnpm contracts:node          # Terminal A
pnpm contracts:compile
pnpm --filter @fuelchain/contracts run deploy
```

Comprobar: http://localhost:3001/blockchain/status → `"live": true`.

Credenciales DEMO (`demo123`):

| Actor | Email | Home |
|-------|-------|------|
| Chofer | `chofer@fuelchain.bo` | `/verify` |
| Estación | `estacion@fuelchain.bo` → ST-CBB-01 | `/estacion` |
| ANH | `anh@fuelchain.bo` | `/supervision` |
| Ciudadano | mapa público | `/mapa` (botón **Ver surtidores** en login) |

Lotes seed: `FC-BO-2026-000181` · `000182` · `000184`.

---

## 2. Recorrido pitch (6–8 min)

### A — Ciudadano / mapa (45 s)

1. En login → **Ver surtidores** → `/mapa`.
2. Mostrá cantidad + calidad por EESS (no menús de operador).
3. Frase: *“El ciudadano ve disponibilidad y calidad; no opera la cadena.”*

### B — Chofer registra el viaje (2 min)

1. Login `chofer@` → **Registrar viaje** (`/verify`).
2. Elegí lote `000182` (en tránsito) → **Generar QR**.
3. El QR se genera **en el navegador** (sin CDN).
4. Opcional: **Tramos GPS** (`/tramos`) → registrar waypoint con GPS del celular.
5. Opcional: **Simular** solo emite el viaje (la estación debe aceptar).
6. Frase: *“El chofer registra el despacho: litros y calidad salen aquí; la estación no inventa calidad al aceptar.”*

### C — Estación recibe (2 min)

1. Login `estacion@` → **Mi estación**.
2. Mostrá tanque Cala Cala + cisternas hacia **esta** EESS (no mapa de toda CBBA).
3. Abrí el deep link del QR (`/q/BT-…`) → registrá litros + densidad/temp/agua → **Aceptar**.
4. Inventario suma el volumen recibido (delta).
5. **Contratos** = acuse estación ↔ chofer. **Liquidaciones** = pago DEMO al chofer.
6. Frase: *“La estación controla su surtidor; no ve la red completa.”*

### D — ANH verifica la red (1–2 min)

1. Login `anh@` → **Movimientos** (`/supervision`).
2. Mostrá entregas de toda la red + tramos GPS bajo cisternas.
3. Frase: *“ANH verifica todos los movimientos; discrepancia ≠ robo.”*

### E — Evidencia blockchain (1 min)

1. Tras aceptar, mostrá estado del ancla / txHash (panel Evidencia o pasaporte).
2. Abrí el explorador HSK si está configurado (`docs/hsk-feria.md`).
3. Frase: *“Ancla = evidencia de integridad, no prueba de litros físicos.”*

### F — Liquidación al chofer (30 s, opcional)

1. `/liquidaciones` → aparece fila PENDING tras la recepción.
2. Estación → **Marcar pagada**.
3. Frase: *“Ciclo cerrado DEMO: entrega → liquidación. No es un banco.”*

---

## 2b. Guion feria 3 minutos

Ver checklist y HSK en **`docs/hsk-feria.md`**.

1. Problema Bolivia (20 s)  
2. Chofer QR → estación acepta (90 s)  
3. Tx HSK + mapa/ANH (50 s)  
4. Cierre “evidencia, no token del litro” (20 s)

---

## 3. Mapa de pantallas (4 actores)

| Pantalla | Quién | Para qué |
|----------|-------|----------|
| `/mapa` | Ciudadano / ANH | Cantidad + calidad pública |
| `/verify` | Chofer | Emitir QR / registrar viaje |
| `/simular` | Chofer | Emitir viaje (sin auto-aceptar) |
| `/tramos` | Chofer, estación, ANH | Checkpoints GPS (salida / tramo / llegada) |
| `/contratos` | Chofer, estación | Acuses DEMO estación ↔ chofer |
| `/liquidaciones` | Chofer, estación | Pago DEMO al completar ruta |
| `/estacion` | Estación | Tanque + cisternas de **su** EESS |
| `/supervision` | ANH | Todos los movimientos |
| `/q/[token]` | Estación (accept) | Aceptar QR de custodia |

SoT menús: `apps/web/src/lib/role-access.ts`.

---

## 4. Cómo explicar el “por qué”

### Problema
Última milla de combustible: quién llevó qué, a qué estación, con qué calidad, y qué midió el tanque — con evidencia compartida.

### Por qué no solo Excel
Varios actores (chofer, estación, regulador, ciudadano) necesitan la misma verdad operacional + una capa de evidencia resistente a cambios.

### Por qué blockchain
> Capa de evidencia compartida: demostrar que un evento y su evidencia digital existían de cierta forma en un momento dado.

**No digas:** “Blockchain evita que roben gasolina.”

### Por qué checkpoints GPS
> El chofer registra tramos (salida, peaje, llegada) con GPS del celular — no tracking continuo. Cantidad/calidad proxy en cada punto.

### Discrepancia
> Señal para auditoría humana. **Discrepancia ≠ robo.**

---

## 5. Frases útiles

- *“Cuatro actores: chofer registra, estación controla su tanque, ANH verifica la red, ciudadano consulta el mapa.”*
- *“Cada litro. Cada movimiento. Cada evidencia.”*
- *“La calidad viaja con el despacho; la estación no la inventa al aceptar.”*
- *“Los datos son DEMO; el modelo es abstracción FuelChain.”*

---

## 6. Qué evitar

| Evitar | Preferir |
|--------|----------|
| Pitch centrado en importador / lotes / auditor | Arco chofer → estación → ANH → mapa |
| “Robo detectado” | “Discrepancia / anomalía para auditoría” |
| “API oficial ANH/YPFB” | “Abstracción DEMO” |
| Estación con mapa de toda Cochabamba | Estación scoped a su EESS |
| “El sensor prueba los litros” | “Medición a reconciliar (hoy simulador)” |

---

## 7. Atajos

| Destino | URL |
|---------|-----|
| Login | http://localhost:3000/login |
| Mapa | http://localhost:3000/mapa |
| Chofer QR | http://localhost:3000/verify |
| Tramos GPS | http://localhost:3000/tramos |
| Estación | http://localhost:3000/estacion |
| ANH | http://localhost:3000/supervision |
| Lote 184 (evidencia) | http://localhost:3000/batches/FC-BO-2026-000184 |
| Health | http://localhost:3001/health |

---

## 8. Si algo falla en vivo

1. `http://localhost:3001/health` → DB up?
2. `docker compose ps` → postgres healthy?
3. `pnpm db:seed`
4. Reiniciá API y web.
5. Blockchain: `blockchain/status` → `"live": true`? Nodo Hardhat + deploy + `.env` + reinicio API.

Guion de emergencia (20 s):

> “FuelChain Bolivia sigue el combustible en la última milla: el chofer registra el viaje, la estación recibe con QR, ANH ve todos los movimientos y el ciudadano consulta cantidad y calidad. La blockchain ancla evidencia; no afirma litros físicos.”

---

## 9. Reglas DEMO (custodia + ancla)

**Lote ≠ viaje.** El QR / Delivery es el movimiento; el lote es la consignación.

Reconciliación del movimiento: esperado vs recibido → MATCH | WITHIN_TOLERANCE | ANOMALY.  
Umbral DEMO: `max(0.5% del esperado, 20 L)`.

Ancla automática (best-effort): RECEIVED → hash canónico → `FuelChain.sol#anchorEvidence`. Si el RPC falla, la recepción ya quedó grabada.

---

## 10. Blockchain: localhost vs HSK Testnet

### Localhost

```env
CHAIN_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Private key = cuenta #0 Hardhat (**solo local**).

### HSK Testnet

Fuente: [Developer QuickStart](https://docs.hashkeychain.net/docs/Developer-QuickStart). Chain ID `133`. No uses Mainnet (177).

```powershell
pnpm contracts:deploy:hsk-testnet
```

Copiá `FUELCHAIN_CONTRACT_ADDRESS` y RPC a `.env`; reiniciá API/web. Gas: HSK de testnet en el deployer. Nunca pongas la private key en el frontend.
