# FuelChain Bolivia — Product / Operations Agent (4 actores)

You are the **product and operations** agent for **FuelChain Bolivia**.

Companion to `FuelChain AGENTS.md` (Web3 / evidence).

---

# Product focus (confirmed)

**Primary job:** path traceability — verify **quantity and quality** at every step of the journey (departure → route waypoint → arrival → station reception).

Do not center pitches on payments, tokenization of fuel, or the legacy importer story. Contracts / liquidaciones are secondary.

**Tagline:** Cantidad y calidad en cada tramo del camino.  
Copy SoT: `apps/web/src/lib/product-copy.ts`.

---

# Product model (confirmed)

Exactly **four** demo actors:

| Actor | Role | Job |
|-------|------|-----|
| **Estación** | `STATION_STAFF` | Own tank; track cisterns to **this** EESS; verify liters + quality on accept; read path tramos |
| **Chofer** | `TRANSPORTER` | Open trip (QR + load qty/quality); write RouteCheckpoints along the path |
| **ANH** | `VERIFIER` | Verify **all** movements and the full path on the network |
| **Ciudadano** | `CITIZEN` | Public map: quantity + quality result at the pump |

Legacy roles (`IMPORTER`, `DEPOT_OPERATOR`, `LAB`, `AUDITOR`) stay in the DB/API for older flows but **must not** appear in DEMO login presets and must not steal focus from the four actors.

Language: the station **receives / verifies fuel at the EESS**. Do not call the station “importador”.

---

# Screens

| Role | Home | Nav (priority) |
|------|------|----------------|
| STATION_STAFF | `/estacion` | Mi estación, **Tramos del viaje**, Contratos |
| TRANSPORTER | `/verify` | Registrar viaje, **Tramos del viaje**, Simular |
| VERIFIER | `/supervision` | Camino y movimientos, **Tramos del viaje** |
| CITIZEN | `/mapa` | Bolivia |

Source of truth: `apps/web/src/lib/role-access.ts`.

Checkpoints GPS (`RouteCheckpoint`): salida / tramo / llegada — chofer writes liters + quality + GPS; station and ANH read. **This is the product core.**

---

# Domain

- `Cistern` + `Delivery` + `FuelBatch.deliveredLiters`
- `RouteCheckpoint`: quantity + quality proxy at each path step
- Quality from dispatch; station accept measures and confronts — does not invent load quality
- Station never sees full Bolivia operator map
- ANH sees full network movements + path
- Blockchain remains evidence of the journey event; anomaly ≠ theft; DEMO labels required

---

# Credentials DEMO

Password `demo123`:

```text
chofer@fuelchain.bo
estacion@fuelchain.bo   → ST-CBB-01
anh@fuelchain.bo
ciudadano@fuelchain.bo
```
