# Guía FuelChain Bolivia — usar la web y explicar el producto

**Tagline:** Cada litro. Cada movimiento. Cada evidencia.  
**Importante:** todo el contenido actual es **DEMO / FUELCHAIN ABSTRACTION**. No es un sistema de YPFB, ANH ni Aduana.

---

## 1. Arrancar (antes de mostrar)

### 1a. App + base de datos

```powershell
docker compose up -d postgres
pnpm db:seed

# Un comando (abre ventanas API / Web / Hardhat)
pnpm demo:up

# O manual:
pnpm --filter @fuelchain/api dev
pnpm --filter @fuelchain/web dev
```

| Servicio | URL |
|----------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Health | http://localhost:3001/health → debe decir `"database":"up"` |

Si la web muestra error de API: confirma que Nest está en `:3001` y que `NEXT_PUBLIC_API_URL` en `.env` apunta ahí.

### 1b. Blockchain local (para demo en vivo)

Incluido si usas `pnpm demo:up`. Si arrancas a mano:

```powershell
# Terminal A — deja corriendo
pnpm contracts:node

# Terminal B — una vez (con el nodo ya arriba)
pnpm contracts:compile
pnpm --filter @fuelchain/contracts run deploy
```

Copia la dirección impresa a `.env` (o deja que la API lea `contracts/deployments/localhost.json`):

```env
CHAIN_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
FUELCHAIN_CONTRACT_ADDRESS=<address del deploy>
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Reinicia la API tras cambiar `.env`. Comprueba:

- http://localhost:3001/blockchain/status → `"live": true`
- UI **Evidencia** → chips verdes → **Anclar ahora**

**Nota DEMO:** la private key es la cuenta #0 de Hardhat (solo local). Nunca uses una clave con fondos reales.

---

## 2. Mapa de la interfaz

Menú izquierdo (o superior en móvil):

| Pantalla | Para qué sirve |
|----------|----------------|
| **Resumen** | Visión global: volumen en custodia, KPIs, lotes recientes, discrepancias |
| **Lotes** | Tabla de FuelBatch + filtros (código, estado, riesgo) |
| **Discrepancias** | Anomaly Center — señales de diferencia de volumen/documentos |
| **Auditorías** | Casos humanos abiertos a partir de anomalías |
| **Evidencia** | Hashes / txs indexados (capa tamper-evident, no DB operacional) |

Al hacer clic en un código `FC-BO-…` entras al **pasaporte digital del lote**.

---

## 3. Recorrido recomendado para la demo (5–8 min)

### Paso A — Resumen (30 s)
1. Abre **Resumen**.
2. Señala el número grande de **volumen declarado en custodia**.
3. Menciona: *“Aquí el operador ve de un vistazo cuánto combustible está bajo seguimiento y cuántas señales de riesgo hay.”*

### Paso B — Los 3 lotes (1 min)
1. Ve a **Lotes**.
2. Muestra la tabla:

| Código | Historia |
|--------|----------|
| `FC-BO-2026-000181` | Bajo riesgo, completado (camino “feliz”) |
| `FC-BO-2026-000182` | Medio riesgo, en tránsito |
| `FC-BO-2026-000184` | **Alto riesgo / auditoría** — el caso estrella |

3. Filtra por riesgo **Alto** o busca `000184`.

### Paso C — Pasaporte del lote 184 (2–3 min)
1. Entra a `FC-BO-2026-000184`.
2. Explica el **header**: producto, volumen, score de riesgo.
3. Baja a **Reconciliación por movimiento**: esperado vs recibido de cada RECEIVED (no lote 150k vs una cisterna).
4. Señala la **diferencia del movimiento** y las discrepancias (señal, no sentencia). Umbral DEMO: 0,5% o 20 L. **Discrepancia ≠ robo.**
5. Revisa documentos, calidad, mediciones y anclas indexadas.
6. Frase clave: *“No decimos ‘robo’. Decimos ANOMALY / DISCREPANCY.”*

### Paso D — Auditoría (1 min)
1. **Auditorías** → abre el caso del lote 184.
2. Muestra score, explicación asistida (mock) y notas.
3. Frase: *“La IA explica patrones; no decide fraude. La decisión es humana.”*

### Paso E — Evidencia en vivo (1–2 min)
1. **Evidencia** (o el pasaporte del lote 184).
2. Confirma chips verdes: RPC ok · Contrato · Clave DEMO.
3. Pulsa **Anclar ahora** → aparece `txHash` + número de bloque reales.
4. Señala la nueva fila (CONFIRMED / PENDING / FAILED). Una recepción válida también ancla sola (best-effort).
5. Frase: *“La evidencia almacenada coincide con el hash anclado.”* Nunca: *“Blockchain demuestra que los litros son reales.”*

Si los chips están en rojo, arranca la cadena local (sección 1b abajo) y reinicia la API.

### Paso F — QR Cochabamba (opcional, 1 min)

1. Login `chofer@fuelchain.bo` → **QR custodia** → generar bastón.
2. El QR apunta a `/q/BT-…?p=` (payload firmado, no solo la URL).
3. Escaneo: la ficha es pública. **Aceptar** pide `estacion@fuelchain.bo` y vuelve al mismo token.
4. El inventario del tanque suma el volumen recibido (delta), no lo trata como nivel absoluto.
5. El rol del body no cuenta: lo decide la sesión.

---

## 4. Cómo explicar el “por qué” (jurado)

### ¿Qué problema resuelve?
Convertir la logística de combustible importado en una **cadena de custodia digital verificable**: origen, documentos, quién lo tuvo, cuánto debía / cuánto midió, calidad, ubicación y si hay discrepancia.

### ¿Por qué no solo Excel / una DB?
Varios actores (importador, transporte, depósito, lab, auditor). Hace falta una capa de **evidencia compartida** además de la base operacional.

### ¿Por qué blockchain?
> Porque múltiples actores participan en la cadena de custodia y necesitamos una capa de evidencia compartida y resistente a modificaciones para demostrar que un evento y su evidencia digital existían de determinada manera en un momento determinado.

**No digas:** “Blockchain evita que roben gasolina.”

### ¿Por qué IA?
> La IA ayuda a interpretar patrones de riesgo y convertir varias señales técnicas en una explicación comprensible para un auditor.

**No digas:** “La IA detecta corrupción sola.”

### ¿Por qué medición / IoT (hoy simulador)?
> Demuestra cómo una medición física (o simulada) entra al sistema y se compara con los registros digitales del lote.

**No digas:** “El ESP32 es un medidor industrial certificado.”  
Hoy: `SIMULATOR`. ESP32 físico = futuro.

### Separación de capas (diagrama verbal)
```text
Evento real
  → Registro digital (FuelBatch + custodia)
  → Medición (simulador / manual / IoT futuro)
  → Reconciliación de volúmenes
  → Anomalía / discrepancia
  → Riesgo explicable
  → Auditoría humana
  → Prueba en blockchain (hash + tx)
```

---

## 5. Frases útiles (elevator)

- *“FuelChain no afirma que la blockchain demuestre físicamente que el combustible existe.”*
- *“Cada litro. Cada movimiento. Cada evidencia.”*
- *“El lote `FC-BO-2026-000184` es el recorrido completo: documentos, custodia, medición, discrepancia, riesgo, auditoría y ancla.”*
- *“Los datos son DEMO; el modelo es una abstracción FuelChain, no una copia de sistemas estatales.”*

---

## 6. Qué evitar en la explicación

| Evitar | Preferir |
|--------|----------|
| “Robo / corrupción detectados” | “Discrepancia / anomalía para auditoría” |
| “Integramos YPFB/ANH vía API oficial” | “Abstracción; sin inventar endpoints gubernamentales” |
| “El sensor prueba los litros” | “El sensor/simulador aporta una medición a reconciliar” |
| “La IA decide el fraude” | “La IA explica; el auditor decide” |

---

## 7. Atajos de URL

| Destino | URL |
|---------|-----|
| Resumen | http://localhost:3000/ |
| Lotes | http://localhost:3000/batches |
| Lote 184 | http://localhost:3000/batches/FC-BO-2026-000184 |
| Discrepancias | http://localhost:3000/anomalies |
| Auditorías | http://localhost:3000/audits |
| Evidencia | http://localhost:3000/blockchain |
| Passport API | http://localhost:3001/batches/FC-BO-2026-000184/passport |

---

## 8. Si algo falla en vivo

1. `http://localhost:3001/health` → DB up?  
2. `docker compose ps` → postgres healthy?  
3. `pnpm db:seed` de nuevo (recrea los 3 lotes DEMO).  
4. Reinicia API y web.
5. Blockchain en vivo: `http://localhost:3001/blockchain/status` → `"live": true`? Si no:
   - ¿`pnpm contracts:node` sigue corriendo?
   - ¿Corriste `pnpm --filter @fuelchain/contracts run deploy` después de levantar el nodo?
   - ¿`.env` tiene `BLOCKCHAIN_PRIVATE_KEY` (cuenta #0 Hardhat) y reiniciaste la API?

Guion corto de emergencia (30 s):

> “FuelChain es una plataforma de integridad de la cadena de combustible. El lote es el centro. Comparamos cantidades declaradas vs medidas, generamos una señal de discrepancia —no una sentencia—, calculamos riesgo explicable, asistimos al auditor y anclamos evidencia digital en blockchain.”

---

## 9. FASE 2 / 3 — reglas DEMO (sin cambiar Prisma)

**Lote ≠ viaje.** `FuelBatch.declaredVolumeLiters` es la consignación. El volumen de un QR / `CustodyEvent.declaredVolume` es el movimiento. `Transport` / `Vehicle` describen el viaje si ya existen.

**Reconciliación del movimiento**

```text
esperado (batón / declaredVolume del RECEIVED)
- recibido (measuredVolume)
= diferencia
→ MATCH | WITHIN_TOLERANCE | ANOMALY
```

Umbral DEMO (no es norma industrial): `max(0.5% del esperado, 20 L)`.  
**Discrepancia ≠ robo.** Una ANOMALY abre `Anomaly` `VOLUME_DISCREPANCY` en `OPEN` para revisión humana. Reejecutar la misma recepción no duplica: se busca `expected = movement:<custodyEventId>`.

**Ancla automática (negocio primero)**

```text
RECEIVED válido → evidencia canónica fuelchain.custody.received.v1
→ keccak256 → FuelChain.sol#anchorEvidence
```

Si el RPC/Hardhat falla, la recepción ya quedó grabada. El índice queda `PENDING` (sin contrato/clave) o `FAILED` (`actorWallet = 'FAILED'`). Reintento: `POST /blockchain/anchor-custody/:custodyEventId`.

**Idempotencia:** a nivel aplicación (mismo `eventId` + `dataHash`). No hay unique constraint en Prisma.

**Outbox real:** BLOQUEADO POR RESTRICCIÓN DE PRISMA. No hay tabla de outbox; el best-effort corre in-process después del commit.

**Verificar:** `GET /blockchain/verify-evidence/:custodyEventId` → MATCH / MISMATCH. Copy: *“La evidencia almacenada coincide con el hash anclado.”*

---

## 10. Blockchain: localhost vs HSK Testnet

El flujo de negocio no cambia. Solo cambian variables de entorno.

### Localhost (default)

```env
CHAIN_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_BLOCK_EXPLORER_URL=
BLOCKCHAIN_PRIVATE_KEY=<cuenta #0 Hardhat — solo local>
```

```powershell
pnpm contracts:node
pnpm contracts:compile
pnpm contracts:deploy
```

El script escribe `contracts/deployments/localhost.json` y pide que copies `FUELCHAIN_CONTRACT_ADDRESS` a `.env`. Reiniciá la API.

### HSK Testnet (red pública de prueba)

Fuente oficial: [Developer QuickStart](https://docs.hashkeychain.net/docs/Developer-QuickStart).

| | |
|---|---|
| Red | HashKey Chain Testnet |
| Chain ID | 133 |
| RPC | `https://testnet.hsk.xyz` |
| Explorer | `https://testnet-explorer.hsk.xyz` |

No uses HSK Mainnet (chain 177). El script de deploy lo rechaza.

1. En `.env` (nunca commitear la clave):

```env
HSK_TESTNET_RPC_URL=https://testnet.hsk.xyz
HSK_TESTNET_CHAIN_ID=133
BLOCKCHAIN_PRIVATE_KEY=0x<clave testnet con HSK de prueba>
```

2. Deploy (vos lo ejecutás; no corre solo):

```powershell
pnpm contracts:deploy:hsk-testnet
```

3. El script escribe `contracts/deployments/hsk-testnet.json` (no toca `localhost.json`) e imprime qué copiar. Ejemplo:

```env
CHAIN_RPC_URL=https://testnet.hsk.xyz
CHAIN_ID=133
FUELCHAIN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=133
NEXT_PUBLIC_FUELCHAIN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://testnet-explorer.hsk.xyz
```

4. Reiniciá API y web. Recibí un bastón → ancla → pasaporte → **Ver en explorador** → **Recalcular hash** → MATCH.

Si `NEXT_PUBLIC_BLOCK_EXPLORER_URL` está vacío, la UI oculta el link; no se rompe.

Gas: necesitás HSK de testnet en el deployer (bridge desde Sepolia según la doc oficial). No pongas la private key en el frontend.
