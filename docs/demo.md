# Guía FuelChain Bolivia — demo pitch (4 actores)

**Foco del producto:** trazabilidad del camino — **cantidad y calidad** verificables en cada tramo (salida → ruta → llegada → recepción).

**Tagline:** Cantidad y calidad en cada tramo del camino.  
**Importante:** contenido **DEMO / FUELCHAIN ABSTRACTION**. No es un sistema de YPFB, ANH ni Aduana.

Producto confirmado: **Estación · Chofer · ANH · Ciudadano**.  
Legacy (importador / depósito / lab / auditor) existe en DB pero **no** se promociona en el pitch.  
Contratos y liquidaciones son secundarios: no roban el relato.

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

## 2. Recorrido pitch (6–8 min) — centrado en el camino

### A — Problema + mapa ciudadano (45 s)

1. Login → **Ver surtidores** → `/mapa`.
2. Mostrá cantidad + calidad por EESS (resultado del camino).
3. Frase: *“El ciudadano ve el resultado; la trazabilidad la construyen chofer y estación.”*

### B — Chofer: abre el camino (2 min)

1. Login `chofer@` → **Registrar viaje** (`/verify`).
2. Lote `000182` → litros + densidad/temp/agua de **carga** → **Generar QR**.
3. **Tramos del viaje** (`/tramos`) → salida / control en ruta / llegada con GPS + litros + calidad.
4. Frase: *“En cada tramo queda cantidad y calidad. Así se verifica el camino completo.”*

### C — Estación: verifica al recibir (2 min)

1. Login `estacion@` → **Mi estación**.
2. Deep link QR (`/q/BT-…`) → medí litros + densidad/temp/agua de **recepción** → **Aceptar**.
3. Opcional: mirá tramos que llegaron a tu EESS.
4. Frase: *“La estación no inventa la calidad de carga; la confronta con lo que mide al recibir.”*

### D — ANH: audita la red (1–2 min)

1. Login `anh@` → **Camino y movimientos** (`/supervision`) + **Tramos del viaje**.
2. Mostrá entregas + checkpoints GPS con litros/calidad.
3. Frase: *“ANH verifica el recorrido; discrepancia ≠ robo.”*

### E — Evidencia blockchain (1 min)

1. Tras aceptar, mostrá ancla / txHash.
2. Explorador HSK si está configurado (`docs/hsk-feria.md`).
3. Frase: *“Ancla = evidencia del evento del recorrido, no prueba de litros físicos.”*

### F — Liquidación (opcional, 20 s)

Solo si preguntan por el ciclo cerrado. No es el foco del pitch.

---

## 2b. Guion feria 3 minutos

1. Problema: ¿quién llevó qué, con qué calidad, por qué camino? (20 s)  
2. Chofer: QR + tramo en ruta (cantidad/calidad) (70 s)  
3. Estación acepta midiendo · ANH ve el camino · mapa (60 s)  
4. Cierre HSK: evidencia del recorrido, no token del litro (30 s)

---

## 3. Mapa de pantallas (4 actores)

| Pantalla | Quién | Para qué |
|----------|-------|----------|
| `/tramos` | Chofer, estación, ANH | **Núcleo:** checkpoints con litros + calidad + GPS |
| `/verify` | Chofer | Abrir viaje: QR con cantidad/calidad de carga |
| `/q/[token]` | Estación | Cerrar camino: verificar cantidad/calidad al recibir |
| `/supervision` | ANH | Todos los movimientos + camino |
| `/mapa` | Ciudadano | Resultado en surtidor |
| `/estacion` | Estación | Tanque + cisternas de **su** EESS |
| `/simular` | Chofer | Emitir viaje (sin auto-aceptar) |
| `/contratos` | Chofer, estación | Secundario: acuses DEMO |
| `/liquidaciones` | Chofer, estación | Secundario: pago DEMO |

SoT menús: `apps/web/src/lib/role-access.ts`.  
SoT copy: `apps/web/src/lib/product-copy.ts`.

---

## 4. Cómo explicar el “por qué”

### Problema
Última milla: quién llevó qué, por qué camino, con qué cantidad y calidad en cada tramo — con evidencia compartida.

### Por qué no solo Excel
Varios actores necesitan la misma verdad operacional del **recorrido** + una capa de evidencia resistente a cambios.

### Por qué blockchain
> Capa de evidencia compartida del evento del camino: demostrar que un registro existía de cierta forma en un momento dado.

**No digas:** “Blockchain evita que roben gasolina.”

### Por qué tramos GPS
> El chofer registra tramos (salida, peaje, llegada) con GPS + litros + calidad proxy — no tracking continuo. Ahí vive la verificación a lo largo del camino.

### Discrepancia
> Señal para auditoría humana. **Discrepancia ≠ robo.**

---

## 5. Frases útiles

- *“Cantidad y calidad en cada tramo del camino.”*
- *“Trazabilidad del viaje: salida → ruta → llegada → recepción.”*
- *“La calidad viaja con el despacho; la estación la confronta al aceptar.”*
- *“No tokenizamos el diésel. Anclamos la evidencia del recorrido.”*
- *“Los datos son DEMO; el modelo es abstracción FuelChain.”*

---

## 6. Qué evitar

| Evitar | Preferir |
|--------|----------|
| Pitch centrado en pagos / liquidaciones | Camino + cantidad/calidad por tramo |
| Pitch centrado en importador / lotes | Arco chofer → tramos → estación → ANH → mapa |
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
| Tramos | http://localhost:3000/tramos |
| Estación | http://localhost:3000/estacion |
| ANH | http://localhost:3000/supervision |
| Health | http://localhost:3001/health |

---

## 8. Notas técnicas rápidas

Ver `README.md`, `docs/hsk-feria.md`, `docs/ENTREGA-FERIA.md`.
