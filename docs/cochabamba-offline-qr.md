# FuelChain Cochabamba — Sistema completo + operación sin señal

**Ciudad piloto:** Cochabamba, Bolivia  
**Fecha:** 2026-09-11  
**Etiqueta:** `FUELCHAIN ABSTRACTION` + datos `DEMO` · contexto local `OFFICIAL / VERIFIED` (filas/escasez reportadas en prensa)

---

## 1. Por qué Cochabamba

En 2024–2025 Cochabamba vivió **filas y tensión de abastecimiento** (gasolina/diésel), con narrativas cruzadas de cupos, especulación, desvíos y sobredemanda. Eso hace vendible un sistema que:

1. dé **certeza al surtidor** (qué cisterna llegó, cuánto quedó en tanque),  
2. permita al **ciudadano** ver dónde hay combustible,  
3. dé a **ANH/auditor** un pasaporte verificable,  
4. funcione en rutas del valle donde **a veces no hay señal**.

Rutas DEMO de abastecimiento (simplificación operativa sobre hub real Arica):

```text
Buque → Terminal Sica Sica / Arica (Chile)   [REPORTADO como hub principal YPFB]
  → Cisterna terrestre hacia Bolivia
  → Plantas / depósito regional
  → EESS valle Cochabamba (Cala Cala, Quillacollo, Sacaba…)  [DEMO]
  → Público consulta /mapa
```

Detalle de importación: `docs/importacion-chile-arica.md`

---

## 2. Arquitectura de información (quién guarda qué)

### 2.1 Tres capas de almacenamiento

| Capa | Dónde | Qué guarda | Cuándo |
|------|-------|------------|--------|
| **A. Edge / celular** | Teléfono del chofer o del encargado de estación | Cola offline de eventos + último QR | Siempre, prioriza sin red |
| **B. Gateway cisterna/tanque** | Equipo Ex-safe + SD (zona segura) | Mediciones cantidad/calidad proxy | Continuo; sincroniza al recuperar red |
| **C. Cloud FuelChain** | Postgres (API Nest) | Fuente de verdad reconciliada + evidencia | Al sincronizar |

**Regla:** sin señal, **nadie pierde el eslabón**. El QR es el puente humano entre actores.

### 2.2 Por qué QR (y no solo “esperar señal”)

En el valle / carreteras / sótanos de estación la cobertura falla. El celular de cada actor ya es el dispositivo más ubicuo.

```text
Chofer (sin datos)                Encargado estación
     │                                  │
     │ 1. Genera QR de ENTREGA          │
     │    (lote, cisterna, litros,      │
     │     hash cadena, firma, seq)     │
     ├──────── escanea ────────────────►│
     │                                  │ 2. Confirma en su app offline
     │◄─────── QR de ACUSE ─────────────┤
     │                                  │
     │ 3. Ambos guardan local           │
     │ 4. Cuando hay señal → sync cloud │
```

Alternativas complementarias (mismo payload):

- **NFC** (si el teléfono lo tiene)  
- **Código corto de 8 caracteres** + papel (si la cámara falla)  
- **Bluetooth cercano** para payloads grandes (fotos/docs)

---

## 3. Protocolo de traspaso QR (offline-first)

### 3.1 Evento canónico (se guarda igual offline y online)

```json
{
  "id": "evt_01HQ...",
  "v": 1,
  "kind": "HANDOFF_DELIVER",
  "batchCode": "FC-BO-2026-000184",
  "fromActor": { "role": "TRANSPORTER", "deviceId": "phone-chofer-9" },
  "toActor": { "role": "STATION", "stationCode": "CBBA-CALA-01" },
  "cisternId": "CIS-CBBA-07",
  "tankId": "TANK-CALA-G90",
  "declaredLiters": 12000,
  "measuredLiters": 11940,
  "qualityProxy": { "tempC": 24.1, "waterDetected": false },
  "seq": 18,
  "prevHash": "sha256:...",
  "payloadHash": "sha256:...",
  "createdAt": "2026-09-11T18:40:00-04:00",
  "mode": "OFFLINE",
  "sig": "ed25519:..."
}
```

### 3.2 Qué va DENTRO del QR (compacto)

El QR no lleva el PDF entero. Lleva un **token corto**:

Opción A — **ID + hash** (recomendado):

```text
fuelchain://h/CBBA/evt_01HQ...?h=ab12cd&s=18
```

Opción B — **payload comprimido Base64URL** (si no hay red ni en la estación para resolver el ID):

```text
fc1.<base64url(json_minificado_firmado)>
```

Si el JSON es grande: el teléfono guarda el evento completo local; el QR solo lleva `id+hash+sig` y al escanear, si ambos están offline, se usa **Bluetooth/NFC** o se muestra un **segundo QR multiparte**.

### 3.3 Cadena de hashes (anti-manipulación sin red)

```text
evt0.hash = H(payload0)
evt1.prevHash = evt0.hash
evt1.hash = H(payload1 + prevHash)
...
```

Al sincronizar, el cloud verifica la cadena. Si hay fork (dos eventos con mismo `seq`), marca **conflicto** → auditoría humana (no “robo automático”).

### 3.4 Ciclo de vida sin señal

1. **Cisterna en ruta:** gateway Ex-safe guarda mediciones en SD; el celular del chofer replica resumen cada vez que hay Bluetooth cerca de la cabina (zona segura).  
2. **Llegada a estación sin datos:** chofer abre app → “Generar entrega” → QR.  
3. **Estación escanea** → crea `HANDOFF_RECEIVE` local + medición de tanque (si el sensor Ex ya midió, se adjunta).  
4. **Estación muestra QR de acuse** → chofer escanea → cierra su evento local.  
5. **Cualquier lado con señal** hace `POST /sync/push` con eventos pendientes (idempotente por `id`).  
6. Cloud actualiza inventario público (semáforo) y pasaporte del lote.

### 3.5 Qué pasa si solo uno sincroniza

- Cloud acepta el evento firmado.  
- El otro, al conectar, envía el mismo `id` → **DUPLICATE / already accepted**.  
- Si los hashes no coinciden → **CONFLICT** visible en consola.

---

## 4. Sensores en Cochabamba (seguridad)

Misma regla nacional:

| Lugar | Hardware | Dónde vive la electrónica “inteligente” |
|-------|----------|-----------------------------------------|
| Tanque subterráneo EESS | Nivel **Ex ia / ATEX** | Gateway en zona segura (oficina/poste) |
| Cisterna | Nivel Ex ia + GPS en cabina | Logger en cabina (no en vapor) |
| Celular | Solo UI + cola offline + cámara QR | Fuera del espacio de vapor al operar |

DEMO: `SIMULATOR` + QR entre dos teléfonos.

---

## 5. Mapa público Cochabamba (ciudadanos)

Pantalla `/cochabamba`:

- Lista/mapa de estaciones DEMO afiliadas  
- Semáforo por producto: **Disponible / Bajo / Sin stock / Sin dato**  
- No publicar litros exactos al público  
- Actualización: última sync del tanque (timestamp)

Esto ataca el dolor real de **filas por incertidumbre**: la gente va a donde hay stock reportado.

---

## 6. Roles en el piloto CBBA

| Rol | Herramienta | Offline |
|-----|-------------|---------|
| Importador / red | Consola web | Opcional |
| Chofer cisterna | App móvil / PWA | **Obligatorio** (cola + QR) |
| Encargado surtidor | App móvil / PWA | **Obligatorio** |
| ANH / auditor | Portal Verify | Online (consulta) |
| Ciudadano | Mapa CBBA | Online |

---

## 7. Modelo de datos (piloto — implementado)

- `Station` — EESS (`ST-CBB-…`, geo, semáforo público)  
- `CustodyBaton` — bastón QR firmado (HMAC DEMO)  
- `OfflineSyncEvent` — cola store-and-forward idempotente (`clientEventId`)  
- `StorageTank` → `stationId` (EESS) o `cisternCode` (cisterna móvil)  
- `Measurement` — litros + T° + `waterDetected` + `density` opcional  

---

## 8. Flujo demo Cochabamba (5 min)

1. Mapa público: estaciones CBBA con semáforos.  
2. Lote en tránsito hacia Cala Cala.  
3. Simular “sin señal”: generar QR de entrega.  
4. “Estación” acepta QR → acuse.  
5. Sync → tanque actualiza disponibilidad.  
6. Verify ANH lee el pasaporte.  
7. Ciudadano ve Cala Cala en **Disponible/Bajo**.

---

## 9. Monetización local

- Fee por estación en el valle (Cochabamba / Quillacollo / Sacaba)  
- Pack cisternas de la red  
- Mapa white-label “Estaciones verificadas FuelChain CBBA”  
- Verify para inspectores (freemium)

---

## 10. Decisión de diseño (QR)

**Sí: QR + cola local + sync idempotente** es lo más robusto para Bolivia rural/periurbana.

No dependas de que la cisterna tenga 4G permanente.  
No metas el cerebro del sistema solo en la nube.  
El celular de cada actor es el **nodo de custodia** cuando no hay red; el QR es el **cable humano**.

---

## 11. Implementación FASE 1 (código actual)

Esto es lo que el backend **sí** hace hoy. Lo anterior (ed25519, NFC, QR de acuse) sigue siendo visión.

### Quién puede emitir / aceptar

| Acción | Endpoint | Roles |
|--------|----------|--------|
| Emitir | `POST /custody-qr/issue` | ADMIN, TRANSPORTER, DEPOT_OPERATOR, IMPORTER |
| Aceptar | `POST /custody-qr/accept` | ADMIN, STATION_STAFF, DEPOT_OPERATOR |
| Sync | `POST /custody-qr/sync` | ADMIN, STATION_STAFF, DEPOT_OPERATOR, TRANSPORTER |
| Ver ficha | `GET /custody-qr/:tokenId` | público (sin aceptar) |

El rol **nunca** se toma del body (`issuedByRole` / `consumedByRole` se ignoran). Sale de la sesión (`AUTH_SECRET` HMAC → `request.user`).

### Payload firmado del QR

El QR de la UI es una URL:

```text
https://host/q/BT-XXXX?p=<base64url(json)>
```

El JSON firmado (HMAC-SHA256 con `CUSTODY_QR_SECRET`) incluye:

```text
v, t, id, batch, cistern, station, vol, ev, ts, exp, n, iss, role, ph, city, label, h, s
```

- `iss` = user id del emisor autenticado
- `exp` = unix de expiración (72 h, validado en el **servidor**)
- `n` = nonce
- `h` / `s` = hash canónico + HMAC (no es el secreto)

`/q/[token]` es **público para ver**. Aceptar exige login de estación/depósito y vuelve al mismo `next` (incluye `?p=`).

### Expiración, consumo, idempotencia

- Si `now > expiresAt` → rechazo y status `EXPIRED`.
- Consumo con `updateMany({ status: ACTIVE, expiresAt > now })` → solo una request gana.
- `clientEventId` es único: reintentar sync no duplica.

### Inventario

Recepción = **delta**:

```text
newStock = currentStockLiters + receivedVolume
fillRatio = newStock / capacity
```

Si `newStock > capacity` → error (no se silencia).

### Estado del lote (mínimo)

Emitir puede pasar el lote a `IN_TRANSIT`. Aceptar pasa a `RECEIVED` si la transición es hacia adelante. **No** se permite `RECEIVED → IN_TRANSIT`.

---

## 12. Pendiente FASE 2 — lote vs viaje

Hoy `FuelBatch.declaredVolumeLiters` se usa a la vez como:

- consignación de importación (p. ej. 100 000 L), y
- volumen del QR de una cisterna (p. ej. 24 800 L).

Consecuencias actuales:

- reconciliar “declarado vs recibido” compara escalas distintas;
- no hay split (1 lote → N cisternas) ni merge (N cisternas → 1 tanque);
- no existe planta/depósito como nodo operativo (el piloto salta a EESS).

Recomendación FASE 2 (sin implementar ahora):

```text
FuelBatch (consignment)
  → Dispatch / ShipmentLeg (viaje de cisterna + volumen allocated)
  → CustodyBaton apunta al Dispatch, no al lote entero
  → recepción y reconciliación por tramo
```
