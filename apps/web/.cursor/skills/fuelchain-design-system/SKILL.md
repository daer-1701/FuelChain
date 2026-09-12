---
name: fuelchain-design-system
description: >-
  FuelChain Bolivia design system canon for apps/web: tokens, typography, roles,
  status patterns, QR/custody UI, maps, tables, numbers, and blockchain-as-evidence.
  Use before any UI design or redesign in FuelChain frontend.
---

# FuelChain Design System

## Purpose

Single source of **product visual + UX canon** for `apps/web`. This is the highest-priority frontend skill after real business/domain rules.

## When to use

- Any UI design, redesign, polish, or new screen in FuelChain web
- Deciding colors, type, status treatment, map/QR/table patterns
- Resolving “does this look like FuelChain?”

## When NOT to use

- Changing NestJS, Prisma, contracts, Hardhat, viem, auth, QR crypto, inventory math
- Inventing new actor roles or nav that contradict `role-access.ts`
- Generic web projects outside FuelChain

## Workflow

1. Confirm screen role audience via `apps/web/src/lib/role-access.ts`.
2. Use tokens from `apps/web/src/app/globals.css` (do not invent parallel palettes).
3. Prefer existing classes: `.fc-sheet`, `.fc-stamp`, `.fc-table`, `.fc-btn`, `.fc-input`, `.fc-batch-code`, `.fc-tank`.
4. Apply domain rules below (QR, map, tables, blockchain evidence).
5. If conflict with polish aesthetics → **this skill wins** (then domain rules win over this).

## Product (do not dilute)

FuelChain Bolivia:

> Cada litro. Cada movimiento. Cada evidencia.

Also in code (`product-copy.ts`): quantity/quality along the path; blockchain anchors **evidence of the journey**, not physical liters.

Platform of:

- trazabilidad
- custodia
- reconciliación
- auditoría
- combustible
- logística
- evidencia blockchain

**Not:** generic fintech, crypto wallet, exchange, or neon Web3 dashboard.

## Visual direction

Transmit:

```text
infraestructura
logística
combustible
terminal
transporte
auditoría
operaciones
trazabilidad
seguridad
```

Direction:

```text
industrial
utilitarian
technical
clean
serious
modern
high-legibility
```

Conceptual inspiration:

```text
terminal de combustible
centro de control logístico
patio de tanques
sistema de supervisión
documentación operativa
```

Avoid military cosplay. Avoid dark-only “industrial” themes. Must work in office and field/ops.

## Typography (current — do not replace casually)

Loaded in `layout.tsx`:

| Family | CSS | Use |
|--------|-----|-----|
| **Chivo** | `--font-chivo` / `font-display` | headings, nav brand, batch codes, stamps, important numbers |
| **IBM Plex Sans** | `--font-plex` / body | content, tables, metadata, forms, technical info |

```text
Chivo → headings, navegación, números importantes, estados
IBM Plex → contenido, tablas, metadata, formularios, información técnica
```

## Color tokens (existing)

From `:root` in `globals.css` — **extend semantically in UI language; do not wholesale replace**:

| Token | Hex / value | Semantic |
|-------|-------------|----------|
| `--haze` | `#b9c9d1` | background / atmosphere |
| `--paper` | `#f3f5f2` | surface |
| `--rail` | `#7e929c` | border / rule |
| `--mute` | `#4d5f68` | text-muted / secondary |
| `--ink` | `#102028` | text-primary |
| `--diesel` | `#d35a00` | primary action / accent |
| `--diesel-soft` | soft orange | primary wash |
| `--seal` | `#1a6e5f` | success / confirmed |
| `--seal-soft` | soft teal | success wash |
| `--alarm` | `#b83228` | danger / anomaly |
| `--alarm-soft` | soft red | danger wash |

Aliases still in CSS (`--void`, `--steel`, `--fuel`, …) map to the above — prefer the **haze/paper/diesel/seal/alarm** names in new work.

Semantic mapping for designers:

```text
background          → --haze
surface             → --paper / .fc-sheet
surface-elevated    → paper + stronger border (not heavy shadow)
border              → --rail (+ ink for strong rules)
text-primary        → --ink
text-secondary      → --mute
text-muted          → --mute
primary             → --diesel
secondary           → ink outline / .fc-btn-ghost
success             → --seal
warning             → diesel tone or explicit amber only if already used
danger              → --alarm
info                → mute + ink stamp
blockchain          → secondary panel; diesel links to explorer
custody             → diesel CTA + stamp ACTIVE/CONSUMED
audit               → alarm for open issues; seal for resolved
```

**Never depend on color alone.** Example:

```text
CONFIRMED
✓ Confirmado
```

not only green.

## Roles (real repo — do not invent)

Canonical UI: `apps/web/src/lib/role-access.ts` + product 4 actors DEMO:

| Role | Audience | UI priority |
|------|----------|-------------|
| `TRANSPORTER` | Chofer | QR emit, tramos GPS, contratos |
| `STATION_STAFF` | Estación | tanque, recibir QR, contratos, tramos inbound |
| `VERIFIER` | ANH | supervisión red, tramos |
| `CITIZEN` | Ciudadano | mapa cantidad/calidad |
| `ADMIN` | full | all nav |
| Legacy: `IMPORTER`, `DEPOT_OPERATOR`, `LAB`, `AUDITOR` | minimal / not DEMO login | do not promote in login |

Conceptual priorities:

```text
CHOFER → QR, custodia, viaje
ESTACIÓN → recepción, inventario, estado
AUDITOR → anomalías, evidencias, historial
VERIFICADOR / CIUDADANO → información pública, evidencia / mapa
```

Labels: `apps/web/src/lib/es-labels.ts`.

## Status patterns

Prefer consistent treatment for:

```text
PENDING
IN_TRANSIT
RECEIVED
CONFIRMED
FAILED
MATCH
WITHIN_TOLERANCE
ANOMALY
```

Always:

```text
icono (when available)
+
label (es-labels / Spanish)
+
color (seal / diesel / alarm / mute)
```

Use `.fc-stamp` for compact status chips when it fits the document aesthetic.

## Blockchain UI

Blockchain = **evidence layer**, not the product.

Show when relevant:

```text
Network
Contract
Transaction
Block
Evidence hash
Status
Explorer
```

Keep these **secondary** to custody/ops flow.

Correct:

```text
Evidencia anclada
```

Incorrect:

```text
100% blockchain verified
blockchain prueba que los litros físicos existen
```

Copy anchor: `PRODUCT_CHAIN_LINE` in `product-copy.ts`.

## QR / custody UI

Optimize for fast ops:

```text
acción principal evidente
pocos pasos
estado visible
errores claros
confirmación inequívoca
```

Distinguish clearly:

```text
emitir
escanear
validar
aceptar
recibido
```

Do not bury primary actions in secondary menus. Routes: `/verify`, `/simular`, `/q/[token]`, `/estacion`.

## Maps

- Map first
- Discrete controls
- Clear contextual detail
- Don’t cover the map unnecessarily
- Station select → clear feedback
- Side/detail panel keeps map context
- Responsive critical (`/mapa`, Cochabamba explorers)

## Tables & data

Prefer tables (`.fc-table`) when comparing:

```text
lotes
movimientos
anomalías
auditorías
volúmenes
transacciones
```

Not everything is a card. Tables need: column hierarchy, numeric alignment, readable dates, visible status, consistent row actions, mobile overflow, empty state.

## Numbers

```text
24 800 L
32 000 L
-120 L
0.37 %
```

- High legibility (`tabular-nums`)
- Always show unit when domain needs it
- Avoid bare `24800` for liters

## Future change rules

```text
Before new components → search existing
Before layout change → understand flow
Before color change → consult these tokens
Before removing content → confirm not required info/logic
Never modify API/backend to fix a visual problem
```

## Priority (when skills conflict)

```text
1. FuelChain domain/business rules
2. FuelChain Design System (this skill)
3. UX Flow Auditor
4. Web Design Guidelines
5. Frontend Design
6. Impeccable polish
```

Never sacrifice:

```text
correctness
business semantics
accessibility
```

for looks.

## Checklist

- [ ] Tokens from `globals.css` only
- [ ] Chivo / Plex roles respected
- [ ] Role/nav aligned with `role-access.ts`
- [ ] Status = label + color (+ icon)
- [ ] Blockchain secondary + honest copy
- [ ] QR primary action obvious
- [ ] Map-first on map routes
- [ ] Tables for comparable datasets
- [ ] Numbers with units

## Output expectations

When applying this skill, state:

- Which role the UI targets
- Which tokens/components reused
- Any deliberate deviation (and why)
