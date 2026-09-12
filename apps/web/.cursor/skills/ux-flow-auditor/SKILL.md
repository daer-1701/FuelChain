---
name: ux-flow-auditor
description: >-
  Audit complete FuelChain user flows (custody QR, reconciliation, blockchain
  evidence, audit) using usability heuristics and ENTRY→ACTION→FEEDBACK→RESULT→NEXT.
  Use when reviewing end-to-end UX, not single-screen polish.
---

# UX Flow Auditor — FuelChain

## Purpose

Review **journeys**, not isolated pixels. Find broken steps, missing feedback, dead ends, and role mismatches across screens.

Grounded in classic usability heuristics:

```text
visibility of system status
match with real world
user control
consistency
error prevention
recognition over recall
recovery from errors
```

## When to use

- “Audit the QR flow”, “walk through reception”, “is reconciliation clear?”
- Before a demo of an end-to-end path
- After wiring multiple screens that must connect
- When users get stuck between pages

## When NOT to use

- Single-screen visual polish → `impeccable`
- One-page a11y checklist only → `web-design-guidelines`
- Inventing a new page look → `frontend-design` + `fuelchain-design-system`
- Changing APIs, Prisma, chain contracts, or custody crypto to “fix UX”

## Workflow

For each critical flow:

1. Name the **actor** (role) and entry URL.
2. Walk:

```text
ENTRY
↓
ACTION
↓
FEEDBACK
↓
RESULT
↓
NEXT ACTION
```

3. Note breaks (missing feedback, wrong role CTA, no recovery).
4. Rank P0/P1/P2 with recommended **frontend-only** fixes when possible.
5. Cross-check menus against `role-access.ts`.

## Rules

### Analysis frame

At every step ask:

- Does the user know where they are?
- Is the next action obvious?
- If it fails, can they recover?
- Does language match the domain (litros, cisterna, estación, evidencia)?
- Are we asking them to remember codes from a previous screen without showing them?

### Critical flows to know

#### Custodia

```text
login
↓
emit QR
↓
scan
↓
accept
↓
RECEIVED
```

Screens: `/login` → `/verify` or `/simular` → `/q/[token]` (estación) → `/estacion` / mapa.

#### Reconciliación

```text
expected
↓
received
↓
difference
↓
MATCH / WITHIN_TOLERANCE / ANOMALY
```

UI must show expected vs received vs delta with units; anomaly is a signal for humans, not automatic fraud guilt.

#### Blockchain

```text
business event
↓
evidence
↓
anchor
↓
CONFIRMED
↓
verify hash
```

Evidence is secondary; status PENDING/FAILED needs retry path for allowed roles without claiming physical liter proof.

#### Auditoría

```text
anomaly
↓
inspection
↓
evidence
↓
decision
```

### FuelChain-specific traps

- Chofer “aceptando” recepción (must be estación)
- Simular that pretends accept completed
- Map as operator home for estación
- Blockchain panel stealing focus from accept/receive
- GPS inventado / silent failure on `/tramos`
- Missing permission-denied → home link
- Dead link to removed routes

## Checklist

- [ ] Actor + entry correct
- [ ] ENTRY → … → NEXT complete with no dead end
- [ ] Feedback on success, pending, failure
- [ ] Recovery path exists
- [ ] Consistent labels across steps (`es-labels`)
- [ ] Role cannot do forbidden actions (or is clearly blocked)
- [ ] Demo honesty: DEMO stamps / copy where needed

## Output expectations

Structure:

```text
Flow: Custodia QR (TRANSPORTER → STATION_STAFF)
P0: ...
P1: ...
Pass: ...
Recommended next UI fixes (no API): ...
```

Optional ASCII of the walk. Do not expand into visual redesign unless asked; hand polish to `impeccable` / structure to `frontend-design`.
