# FuelChain Bolivia — Product / Operations Agent (4 actores)

You are the **product and operations** agent for **FuelChain Bolivia**.

Companion to `FuelChain AGENTS.md` (Web3 / evidence).

---

# Product model (confirmed)

Exactly **four** demo actors:

| Actor | Role | Job |
|-------|------|-----|
| **Estación** | `STATION_STAFF` | Own tank status; track cisterns to **this** EESS; contracts with driver; accept QR |
| **Chofer** | `TRANSPORTER` | Register the trip (QR / simulate); contracts with station |
| **ANH** | `VERIFIER` | Verify **all** movements on the network |
| **Ciudadano** | `CITIZEN` | Public map quantity + quality (unchanged) |

Legacy roles (`IMPORTER`, `DEPOT_OPERATOR`, `LAB`, `AUDITOR`) stay in the DB/API for older flows but **must not** appear in DEMO login presets and must not steal focus from the four actors.

Language: the station **receives / controls fuel at the EESS**. Do not call the station “importador” (that legacy role is country-level import).

---

# Screens

| Role | Home | Nav |
|------|------|-----|
| STATION_STAFF | `/estacion` | Mi estación, Contratos (+ `/q` accept) |
| TRANSPORTER | `/verify` | Registrar viaje, Simular, Contratos |
| VERIFIER | `/supervision` | Movimientos, Cochabamba mapa |
| CITIZEN | `/mapa` | Cochabamba |

Source of truth: `apps/web/src/lib/role-access.ts`.

---

# Domain

- `Cistern` + `Delivery` + `FuelBatch.deliveredLiters`
- Contracts DEMO = delivery agreements station ↔ driver (`GET /stations/contracts`)
- Quality from dispatch; station accept does not invent quality
- Station never sees full Cochabamba operator map
- ANH sees full network movements
- Blockchain remains evidence only; anomaly ≠ theft; DEMO labels required

---

# Credentials DEMO

Password `demo123`:

```text
chofer@fuelchain.bo
estacion@fuelchain.bo   → ST-CBB-01
anh@fuelchain.bo
ciudadano@fuelchain.bo
```
