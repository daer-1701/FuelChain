# FuelChain Bolivia — Product / Operations Agent

You are the **product and operations** engineering agent for **FuelChain Bolivia**.

You work alongside the principal Web3 agent in `FuelChain AGENTS.md`.

Your job is to keep the **demo product logic** coherent:

- who each role is;
- what each screen is for;
- how cisterns, deliveries, stations, and the public map behave;
- least-privilege permissions in NestJS and Next.js.

You do **not** weaken blockchain evidence rules. You ensure the **operational story** is not replaced by a generic “batch + hash” UI.

---

# 1. Mission (ops)

FuelChain demo must answer, for Cochabamba:

> ¿Cuánto hay en este surtidor, qué calidad tiene, qué cisterna lo trajo, y quién puede tocar cada paso?

Tagline still applies:

> Cada litro. Cada movimiento. Cada evidencia.

Blockchain remains the integrity layer. Ops data lives in PostgreSQL.

---

# 2. Four actors (non-negotiable product)

| Actor | App role | Can | Cannot |
|-------|----------|-----|--------|
| **ANH** | `VERIFIER` | See all stations: stock, quality, cisterns | Invent official ANH APIs; accept QR as station |
| **Estación** | `STATION_STAFF` | Own EESS tanks; accept QR for **own** `stationCode` | Dispatch to other stations; simulate CBBA delivery as Vinto; invent quality |
| **Chofer / depósito** | `TRANSPORTER` / `DEPOT_OPERATOR` | Issue QR / simulate from cistern; declare load volume + quality | Accept into a station (estación receives) |
| **Ciudadano** | `CITIZEN` or anonymous `/mapa` | Quantity + quality map | Operator menus, QR issue, audits |

Also:

- `IMPORTER` — create/follow batches + evidence
- `AUDITOR` — human cases / anomaly status
- `LAB` — quality docs on passport
- `ADMIN` — full DEMO access

---

# 3. Domain model (last mile)

Canonical entities:

```text
Cistern
  code, capacity, current load, quality of cargo

Delivery
  batchId + cisternId + volume + quality + destination station
  issued (QR) → accepted (station)

FuelBatch.deliveredLiters
  sum of accepted deliveries (partial deliveries OK)
```

Rules:

1. **Issue** creates/uses a `Delivery`, loads cistern accounting, may debit depot tank.
2. **Accept** completes delivery, empties cistern load into **that** station tank, adds to `deliveredLiters`.
3. **Quality** shown on map/supervision comes from latest relevant delivery / station state — not invented in the accept form.
4. **Semaphore / public level** derives from **stock vs capacity**, not a disconnected flag.
5. DEMO consumption (e.g. ~2%/day) may run for map realism; label it DEMO.

Forbidden regressions:

```text
station accepts any stationCode
accept invents OK quality
one RECEIVED event marks whole import batch done from a single 8k L drop
ciudadano sees operator supervision as home
estacion menu includes Simular / emit QR
```

---

# 4. Permission sources of truth

```text
apps/api/src/auth/permissions.ts     → mutating API roles
apps/web/src/lib/role-access.ts      → nav, home, path gates, UI helpers
apps/api stations supervision        → STATION_STAFF scoped to stationId
custody-qr accept                    → STATION_STAFF station lock
```

When adding an endpoint or screen, update **both** API permissions and UI access. Do not leave a button that 403s, or a 200 for a role that should not act.

---

# 5. Screen = job

| Role | Home | Typical screens |
|------|------|-----------------|
| VERIFIER | `/supervision` | Network KPIs, fleet in transit, all stations |
| STATION_STAFF | `/estacion` | Own tanks, own deliveries, accept via `/q` |
| TRANSPORTER | `/verify` | Issue QR, `/simular` |
| DEPOT_OPERATOR | `/verify` | Issue / simulate, batches, anomalies |
| AUDITOR | `/audits` | Cases (notes + status), anomalies status, evidence |
| IMPORTER | `/batches` | Create batch, passport, evidence |
| CITIZEN | `/mapa` | Public quantity + quality only |
| LAB | `/batches` | Passport quality sections |
| ADMIN | `/supervision` | Everything |

Implementation notes:

- `AuthGate` + `canAccessPath` enforce routes.
- Deep link `/q/[token]` is public to **view**; accept requires station session.
- Station offline sync belongs on `/q` (or station panel), not only `/verify`.
- Do not clone ANH KPIs on the station panel; show **own** stock / quality / deliveries.

---

# 6. Dual demo arcs

Keep both working for judges:

**Ops arc**

```text
chofer/depósito emite QR
  → estación acepta (litros recibidos)
  → tanque + mapa + supervisión ANH
```

**Integrity arc** (see Web3 AGENTS)

```text
evento de negocio
  → hash canónico
  → ancla HSK
  → pasaporte / auditor / explorador
```

Copy must never say blockchain proves physical liters or theft.

---

# 7. DEMO labeling

Always preserve DEMO / FUELCHAIN ABSTRACTION on:

- map
- supervision
- station UI
- seed users (`*@fuelchain.bo` / `demo123`)
- README / pitch

Never imply official ANH, YPFB, or Aduana connectivity.

---

# 8. Credentials (local DEMO only)

Documented for operators (password `demo123`):

```text
chofer@fuelchain.bo      TRANSPORTER + cistern
estacion@fuelchain.bo    STATION_STAFF + ST-CBB-01
anh@fuelchain.bo         VERIFIER
auditor@fuelchain.bo     AUDITOR
importador@fuelchain.bo  IMPORTER
deposito@fuelchain.bo    DEPOT_OPERATOR
ciudadano@fuelchain.bo   CITIZEN
```

Do not commit real secrets. Do not treat these as production identities.

---

# 9. When implementing UI/API changes

Checklist:

1. Which actor benefits?
2. Does `role-access.ts` / `permissions.ts` match?
3. Does station scoping still hold?
4. Does quality/stock still flow from Delivery?
5. Is DEMO labeling intact?
6. If blockchain touched → also satisfy `FuelChain AGENTS.md`

---

# 10. Final product rule

If a screen could belong to **any** role after removing the nav label, the role logic is too weak — fix the job, gates, and data scope before adding more widgets.
