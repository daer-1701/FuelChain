# FuelChain Bolivia — Arquitectura

**Versión:** 1.0  
**Fecha:** 2026-09-11  
**Estado:** Demo operativa — monorepo, API, web, seed, reconciliación de volumen, anclado Hardhat en vivo. ESP32 diferido.  
**Gestor de paquetes:** `pnpm` exclusivamente (no `npm` / `npx`)  
**Tagline:** *Cantidad y calidad en cada tramo del camino.*

---

## 1. Resumen del estado actual

El repositorio **ya no es greenfield**. Incluye:

| Área | Estado |
|------|--------|
| `apps/web` + `apps/api` | Operativos |
| Prisma + Postgres + seed DEMO | Operativo |
| Pasaporte + reconciliación de volúmenes | Operativo |
| Blockchain live (Hardhat + viem) | Operativo (local DEMO) |
| IoT ESP32 | Diferido (seed usa `SIMULATOR`) |
| Auth / IPFS / testnet pública | Fuera de scope demo |

> Las secciones históricas siguientes conservan el diseño original de PHASE 0; ante conflicto, manda el estado de la tabla de arriba y `docs/demo.md`.

---

## 1b. Análisis del repositorio (histórico PHASE 0)

### 1.1 Inventario (al inicio del proyecto)

| Ítem | Hallazgo |
|------|----------|
| Código de aplicación | **No existe** |
| `apps/web`, `apps/api` | **Ausentes** |
| `package.json` / `pnpm-workspace.yaml` / lockfile | **Ausentes** |
| `docs/` (previo) | No estaba; se crea en esta fase |
| Git de aplicación | Sin historial de producto |
| Regla Cursor | `.cursor/rules/use-pnpm.mdc` — **conservar** |
| `node_modules/` | **Huérfano** (restos de un scaffold abortado: eslint/typescript-eslint junctions + `.pnpm`) |

### 1.2 Contexto de intento previo (sesión anterior)

En una sesión previa se inició un monorepo y se scaffoldearon con éxito:

- Next.js 15.2.4 en `apps/web` (con pnpm)
- NestJS CLI 11 en `apps/api` (`--skip-install`)

Luego desaparecieron `apps/`, manifests raíz, Docker y docs. Quedó solo `node_modules` incompleto.  
**Conclusión operativa:** tratar el repo como **greenfield funcional**, con una limpieza menor de residuos en PHASE 1.

### 1.3 Tecnologías detectadas (reales hoy)

| Tecnología | Estado |
|------------|--------|
| pnpm (regla) | Declarado / obligatorio |
| Next.js / NestJS / Prisma / Hardhat / MQTT | **No instalados en el árbol de proyecto** |
| PostgreSQL / Mosquitto | No configurados |
| Contratos Solidity | No existen |

### 1.4 Problemas

1. **Greenfield:** no hay funcionalidad que preservar; hay que crear la estructura desde cero.
2. **`node_modules` huérfano:** sin `package.json`/`lockfile` → estado inconsistente; eliminar en PHASE 1 antes de reinstalar.
3. **Next 15.2.4** (si se reutiliza la versión del intento previo) tiene aviso de seguridad conocido → preferir **versión parchada** de Next 15.x en PHASE 1.
4. El prompt de testing menciona `npm run …` → en este repo se traducirá siempre a **`pnpm …`**.

### 1.5 Qué NO se tocará sin justificación

- `.cursor/rules/use-pnpm.mdc` — se mantiene.
- No se inventarán APIs/sistemas gubernamentales reales.
- No se afirmará que blockchain/IoT demuestran existencia física del combustible.

---

## 2. Principios arquitectónicos

### 2.1 Separación de responsabilidades

| Capa | Rol |
|------|-----|
| **Blockchain** | Integridad y trazabilidad de eventos digitales (tamper-evident), no DB operacional |
| **IoT (ESP32 / simulator)** | Mediciones físicas de demostración |
| **Backend (NestJS)** | Procesamiento, reconciliación, risk, orquestación |
| **PostgreSQL** | Fuente de verdad operacional |
| **Storage / IPFS (P2)** | Documentos y evidencias off-chain |
| **IA** | Explicación de anomalías para el auditor — **no decide fraude** |
| **Auditor (humano)** | Investigación y decisión |

### 2.2 Modelo central

La unidad no es “Importación”, sino **`FuelBatch`** (`FC-BO-YYYY-######`).

Todo (documentos, custodia, calidad, IoT, anomalías, auditoría, anclas on-chain) cuelga del lote.

### 2.3 Respuestas canónicas (demo / jurado)

| Pregunta | Respuesta correcta |
|----------|-------------------|
| ¿Por qué blockchain? | Múltiples actores; capa de evidencia compartida y resistente a modificación para demostrar que un evento/hash existía en un momento dado. **No:** “evita el robo de gasolina”. |
| ¿Por qué IA? | Interpreta señales de riesgo y las convierte en explicación comprensible para un auditor. **No:** “detecta corrupción”. |
| ¿Por qué ESP32? | Demuestra cómo una medición física entra al sistema y se compara con registros digitales. **No:** hardware industrial certificado. |

### 2.4 Vocabulario de anomalías

Nunca etiquetar automáticamente: “robo”, “corrupción”, “combustible perdido”.  
Usar: **ANOMALY / DISCREPANCY**. La anomalía es una señal para auditoría.

### 2.5 Etiquetado de verdad

| Etiqueta | Uso |
|----------|-----|
| `OFFICIAL / VERIFIED` | Solo lo respaldado por fuentes oficiales documentadas |
| `DEMO / ASSUMPTION` | Datos, umbrales, rutas, parámetros y simplificaciones de hackathon |
| `FUELCHAIN ABSTRACTION` | Modelo propio, no réplica de un sistema gubernamental |

---

## 3. Arquitectura propuesta (target)

### 3.1 Diagrama lógico

```text
[Actors / UI Next.js]
        │ HTTP/REST
        ▼
[NestJS API]
  ├── Batches / Custody / Quality / Documents
  ├── ReconciliationEngine
  ├── RiskEngineService
  ├── AIService (Mock | Real)
  ├── Anomalies / Audits
  ├── BlockchainService (viem)
  └── MqttIngestService
        │                         │
        ▼                         ▼
 [PostgreSQL + Prisma]     [MQTT Broker Mosquitto]
                                  ▲
                    ┌─────────────┴─────────────┐
                    │                           │
              [ESP32 firmware]          [Node simulator]
                    │
                    ▼
            tank measurements

[Off-chain docs FS/IPFS] ──SHA-256──► hash anclado on-chain
[Hardhat / Base Sepolia] ◄── FuelChain.sol (audit layer)
```

### 3.2 Estructura de repositorio propuesta

Adaptada al prompt y a monorepo pnpm (sin forzar carpeta raíz `fuelchain/` si el workspace ya es `d:\Buildathon`):

```text
Buildathon/
├── apps/
│   ├── web/                 # Next.js — Dashboard + Batch Passport
│   └── api/                 # NestJS — dominio + engines + MQTT
├── packages/
│   ├── shared/              # tipos, enums, DTOs compartidos, constantes DEMO
│   ├── blockchain/          # ABI helpers / clients tipados (opcional)
│   └── config/              # eslint/tsconfig compartidos
├── contracts/               # Hardhat + FuelChain.sol
├── iot/
│   ├── esp32/               # firmware demo
│   └── simulator/           # Node.js → MQTT (demo sin hardware)
├── prisma/                  # schema + migrations + seed
├── docs/                    # architecture, proceso BO, assumptions, …
├── scripts/                 # seed helpers, demo narrative runner
├── docker/
│   └── mosquitto/
├── docker-compose.yml       # postgres + mosquitto
├── .env.example
├── package.json             # workspace root
├── pnpm-workspace.yaml
├── turbo.json               # orquestación scripts (recomendado)
└── README.md
```

### 3.3 Stack (decisiones)

| Capa | Elección | Notas |
|------|----------|-------|
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Lucide + Recharts + React Leaflet | UX enterprise / audit |
| Backend | NestJS + TypeScript | Módulos por dominio |
| DB | PostgreSQL 16 + Prisma | Fuente operacional |
| Blockchain | Solidity + Hardhat + viem (+ wagmi en web) | Testnet L2 (p. ej. Base Sepolia) o Hardhat local — **no Mainnet** |
| IoT | ESP32 + MQTT + Mosquitto + simulator Node | **ESP32 físico: diferido a futuro** (decisión 2026-09-10). Demo puede usar `SIMULATOR` / `MANUAL` sin hardware. |
| AI | `AIProvider` → `MockAIProvider` + `RealAIProvider` opcional | Sin API keys en código |
| Docs storage P0 | Filesystem local + SHA-256 | IPFS = P2 |
| Infra | Docker Compose | Postgres + Mosquitto |
| Monorepo | pnpm workspaces + Turborepo | Scripts `dev/build/lint/typecheck/test` |

### 3.4 Flujo de valor (demo jurado)

```text
REAL-WORLD EVENT
 → DIGITAL RECORD (FuelBatch + CustodyEvent)
 → PHYSICAL MEASUREMENT (ESP32/SIMULATOR)
 → RECONCILIATION
 → ANOMALY / DISCREPANCY
 → RISK ANALYSIS (explicable)
 → AI EXPLANATION (auditor)
 → AUDIT CASE (humano)
 → BLOCKCHAIN PROOF (hash + tx)
```

---

## 4. Modelo de datos (resumen)

### 4.1 Entidades P0/P1

| Entidad | Propósito |
|---------|-----------|
| `FuelBatch` | Lote central (`batchCode`, producto, volúmenes, origen, estado, risk) |
| `ImportAuthorization` | Autorizaciones variables por lote |
| `Transport` / `Vehicle` | Multimodal: TRUCK, RAIL, WATER, PIPELINE, OTHER |
| `CustomsEvent` | Eventos aduaneros / frontera (abstracción FuelChain) |
| `CustodyEvent` | Cadena de custodia + `evidenceHash` / `transactionHash` |
| `Document` | Off-chain + `sha256Hash` + ancla on-chain |
| `QualityCertificate` / `SamplingEvent` / `LabAnalysis` | Calidad first-class; parámetros JSON flexibles |
| `StorageTank` / `Measurement` | Tanques + IoT (`ESP32` \| `SIMULATOR` \| `MANUAL`) |
| `Anomaly` | Discrepancias; estados OPEN / UNDER_REVIEW / RESOLVED / FALSE_POSITIVE |
| `AuditCase` | Investigación humana |
| `BlockchainAnchor` / registro de txs | Vínculo evento ↔ on-chain |
| `User` / roles | ADMIN, IMPORTER, TRANSPORTER, DEPOT_OPERATOR, LAB, AUDITOR |

### 4.2 CustodyEvent types

`CREATED` → `LOADED` → `INSPECTED` → `IN_TRANSIT` → `ENTERED_COUNTRY` → `CUSTOMS` → `RECEIVED` → `SAMPLED` → `LAB_ANALYSIS` → `CERTIFIED` → `STORED` → `DISPATCHED` → `DELIVERED`

### 4.3 Document types

`CERTIFICATE_OF_ORIGIN`, `QUALITY_CERTIFICATE`, `CUSTOMS_DOCUMENT`, `TRANSPORT_DOCUMENT`, `LAB_RESULT`, `INSPECTION_REPORT`, `OTHER`

---

## 5. Motores de dominio

### 5.1 ReconciliationEngine

Compara volúmenes entre hitos (Declared / Border / Depot / Sensor), calcula diferencias absolutas y %, y emite señales `ANOMALY` sin culpar.

### 5.2 RiskEngineService

Score 0–100, explicable. Pesos **DEMO** (documentar en `docs/risk-engine.md`):

| Factor | Peso DEMO |
|--------|-----------|
| Volume discrepancy | 30% |
| Documentation | 20% |
| Transit anomaly | 20% |
| Measurement anomaly | 15% |
| Missing events | 15% |

Salida ejemplo: `{ score, level, factors[], recommendedAction }`.

### 5.3 AIService

Recibe salida estructurada del Risk Engine → texto para auditor.  
`MockAIProvider` determinista sin red; `RealAIProvider` vía env.

### 5.4 Document integrity

```text
PDF/file → SHA-256 → store off-chain → register hash on-chain → Verify Document
```

### 5.5 Blockchain (`contracts/FuelChain.sol`)

Eventos conceptuales: `BatchCreated`, `AuthorizationReferenced`, `CustodyEventRegistered`, `DocumentHashRegistered`, `SampleRegistered`, `LabResultRegistered`, `QualityCertified`, `MeasurementAnchored`, `AnomalyRegistered`.

On-chain solo: `batchId`, `eventId`, timestamp, actor, hash, metadata esencial.

---

## 6. API (NestJS) — módulos previstos

| Módulo | Responsabilidad |
|--------|-----------------|
| `batches` | CRUD + passport aggregate |
| `custody` | Timeline / eventos |
| `quality` | Certificados, muestreo, lab |
| `documents` | Upload, hash, verify |
| `tanks` / `measurements` | Storage + IoT ingest |
| `reconciliation` | Diffs y series |
| `risk` | Score explicable |
| `ai` | Explicaciones |
| `anomalies` | Centro de anomalías |
| `audits` | Casos de auditoría |
| `blockchain` | Anclado / lectura de proofs |
| `mqtt` | Subscribe `fuelchain/tanks/{tankId}/measurements` |
| `auth` (P1) | Roles + wallet binding liviano |

---

## 7. Frontend (Next.js) — rutas

| Ruta | Función |
|------|---------|
| `/` | Dashboard KPIs |
| `/batches` | Tabla + filtros |
| `/batches/[id]` | **Digital Batch Passport** (tabs: Overview, Custody, Quality, Volumes, Documents, IoT, Anomalies, Blockchain, Audit) |
| `/anomalies` | Anomaly Center |
| `/audits/[id]` | Audit Case |
| `/blockchain` | Verificación explorador |

KPIs: Total Batches, In Transit, Delivered, Certified, Audit Required, High Risk, Total Volume, Discrepancies.

Estética: enterprise logistics/audit (dark/light profesional). Evitar look “CRUD universitario”.

---

## 8. IoT / MQTT

**Topic:** `fuelchain/tanks/{tankId}/measurements`

**Payload DEMO:**

```json
{
  "deviceId": "ESP32-TANK-001",
  "tankId": "TANK-001",
  "volumeLiters": 98650,
  "temperature": 24.3,
  "timestamp": "2026-09-07T20:00:00Z"
}
```

El simulador Node garantiza demo sin ESP32 físico. Firmware en `iot/esp32/` es demostración, no certificación industrial.

---

## 9. Datos DEMO (mínimo 3 lotes)

| Batch | Volumen | Risk | Estado |
|-------|---------|------|--------|
| 1 | 100,000 L | LOW | CERTIFIED / COMPLETED |
| 2 | 150,000 L | MEDIUM | IN_TRANSIT |
| 3 `FC-BO-2026-000184` | 100,000 L | HIGH | AUDIT REQUIRED |

Narrativa Batch 3: Declared 100 000 → Received 99 900 → Stored 98 700 → ESP32 98 650 → reconciliation → risk ~82 HIGH → AI → anomaly on-chain → Audit Case.

Todos los datos ficticios: **DEMO**.

---

## 10. Documentación a crear (fases posteriores)

| Archivo | Contenido |
|---------|-----------|
| `docs/architecture.md` | Este documento (PHASE 0) |
| `docs/bolivia-fuel-process.md` | Investigación YPFB/ANH/Aduana/normativa — sin inventar APIs |
| `docs/blockchain.md` | Rol on-chain / off-chain |
| `docs/iot.md` | ESP32 + MQTT + límites del prototipo |
| `docs/reconciliation.md` | Fórmulas y semántica de discrepancia |
| `docs/risk-engine.md` | Pesos DEMO y umbrales |
| `docs/demo.md` | Guion de 12 pasos para el jurado |
| `docs/assumptions.md` | OFFICIAL vs DEMO / ASSUMPTION |

`bolivia-fuel-process.md` es **obligatorio antes** de implementar lógica que pretenda reflejar importación real; se redacta en PHASE 1 (docs) con fuentes verificables.

---

## 11. Priorización

### P0 (no negociable)

FuelBatch, Passport, Dashboard, tabla, detail, custody, reconciliation, anomalies, Risk Engine, smart contract, blockchain verify, document hashing, ESP32 simulator, MQTT, integración ESP32.

### P1

AI, quality UI completa, documents UI, audits, map, wallet, auth.

### P2

IPFS, reputation avanzada, analytics avanzados, notificaciones realtime, identidad Web3 avanzada.

**No sacrificar P0 por P2.**

---

## 12. Orden de implementación (acordado)

| Phase | Alcance |
|-------|---------|
| **0** | Análisis + este documento — **STOP / aprobación** |
| 1 | Base monorepo (pnpm, turbo, docker, env, apps scaffold, limpia `node_modules`) |
| 2 | Prisma + PostgreSQL |
| 3 | FuelBatch + entidades |
| 4 | Seed DEMO (3 lotes) |
| 5 | API NestJS |
| 6 | Dashboard |
| 7 | Batch Passport |
| 8 | Chain of Custody |
| 9 | Reconciliation |
| 10 | Risk Engine |
| 11 | Smart Contract |
| 12 | Blockchain integration |
| 13 | Document hashing |
| 14 | MQTT + simulator (sin depender de ESP32) |
| 15 | ESP32 físico — **DIFERIDO / futuro** (no bloquea P0 actual) |
| 16 | Quality |
| 17 | AI |
| 18 | Audit |
| 19 | Map |
| 20 | Auth / roles |
| 21 | Testing |
| 22 | UX polish |
| 23 | Demo prep |
| 24 | Documentation restante |

---

## 13. PHASE 1 — archivos y dependencias previstas

### 13.1 Archivos a crear / modificar

| Acción | Path |
|--------|------|
| Eliminar | `node_modules/` huérfano |
| Crear | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.env.example`, `README.md` |
| Crear | `docker-compose.yml`, `docker/mosquitto/mosquitto.conf` |
| Crear | `apps/web` (Next.js), `apps/api` (NestJS) |
| Crear | `packages/shared`, `packages/config` (stubs) |
| Crear | `contracts/` (stub Hardhat), `iot/esp32`, `iot/simulator`, `prisma/`, `scripts/` |
| Crear | `docs/bolivia-fuel-process.md` (investigación; puede iniciar vacío estructurado) |
| Conservar | `.cursor/rules/use-pnpm.mdc`, `docs/architecture.md` |

### 13.2 Dependencias principales

**Root:** `turbo`, `typescript`, `prettier`, `eslint` (workspace).

**apps/web:** `next`, `react`, `tailwindcss`, componentes shadcn, `lucide-react`, `recharts`, `react-leaflet` / `leaflet`, `wagmi`, `viem`, `@tanstack/react-query`.

**apps/api:** `@nestjs/*`, `prisma` / `@prisma/client`, `mqtt`, `viem`, `class-validator`, `class-transformer`, multer/fs para docs.

**contracts:** `hardhat`, `@nomicfoundation/hardhat-toolbox`, `viem` (scripts).

**iot/simulator:** `mqtt` (Node).

**Infra:** imágenes Docker `postgres:16-alpine`, `eclipse-mosquitto:2`.

### 13.3 Scripts raíz (pnpm)

```text
pnpm dev | build | lint | typecheck | test
pnpm db:migrate | db:seed
pnpm simulate:iot
pnpm contracts:compile | contracts:test | contracts:deploy
```

---

## 14. Seguridad (constraints)

- Sin secrets en Git; `.env` en `.gitignore`; solo `.env.example`.
- Sin private keys en el repo.
- Sin PII / PDFs / secretos on-chain.
- Validar en backend (no confiar solo en frontend ni en MQTT crudo).
- Mediciones IoT = señal a reconciliar, no verdad absoluta.

---

## 15. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Scope creep P2 | Strict P0 primero |
| Confundir demo con sistema estatal | `assumptions.md` + etiquetas DEMO |
| Dependencia de ESP32 físico | Simulator obligatorio |
| Testnet inestable en demo | Fallback Hardhat local + explorador mockeable |
| Next con CVE | Usar versión parchada en scaffold |

---

## 16. Criterio de éxito de la arquitectura

El jurado debe poder recorrer:

**BATCH → DOCUMENTS → QUALITY → CUSTODY → MEASUREMENTS → RECONCILIATION → RISK → AUDIT → BLOCKCHAIN**

y entender por qué **IoT + AI + Blockchain + Cloud + Web** trabajan juntos, no como adornos.

---

## 17. Decisión solicitada

**¿Aprobar PHASE 0 y autorizar PHASE 1** (limpieza de `node_modules`, scaffold monorepo pnpm, Docker, `.env.example`, apps web/api, stubs de packages/contracts/iot/prisma, inicio de `docs/bolivia-fuel-process.md`)?

Hasta confirmación explícita: **no se escribe código de aplicación**.
