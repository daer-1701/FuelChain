# Guía FuelChain Bolivia — usar la web y explicar el producto

**Tagline:** Cada litro. Cada movimiento. Cada evidencia.  
**Importante:** todo el contenido actual es **DEMO / FUELCHAIN ABSTRACTION**. No es un sistema de YPFB, ANH ni Aduana.

---

## 1. Arrancar (antes de mostrar)

### 1a. App + base de datos

En terminales, desde `D:\Buildathon`:

```powershell
docker compose up -d postgres
pnpm db:seed

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

Necesitas **una terminal extra** con el nodo Hardhat, y luego un deploy:

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
3. Baja a **Cadena de custodia**: cada evento es un eslabón (creación → tránsito → frontera → recepción → lab → almacenamiento).
4. Señala **Discrepancias**: diferencia deliberada del demo:

```text
Declarado   100,000 L
Recepción    99,900 L
Almacén      98,700 L
Simulador    98,650 L   (source = SIMULATOR; ESP32 físico está diferido)
```

5. Frase clave: *“No decimos ‘robo’. Decimos ANOMALY / DISCREPANCY: puede ser medición, calibración, temperatura, documentación u otros factores. Es una señal para el auditor.”*

### Paso D — Auditoría (1 min)
1. **Auditorías** → abre el caso del lote 184.
2. Muestra score, explicación asistida (mock) y notas.
3. Frase: *“La IA explica patrones; no decide fraude. La decisión es humana.”*

### Paso E — Evidencia en vivo (1–2 min)
1. **Evidencia** (o el pasaporte del lote 184).
2. Confirma chips verdes: RPC ok · Contrato · Clave DEMO.
3. Pulsa **Anclar ahora** → aparece `txHash` + número de bloque reales.
4. Señala la nueva fila en la tabla (estado ANCHORED).
5. Frase: *“Blockchain no prueba que el litro exista. Prueba que este evento y este hash quedaron registrados de forma resistente a modificación.”*

Si los chips están en rojo, arranca la cadena local (sección 1b abajo) y reinicia la API.

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
