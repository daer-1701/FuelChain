---
name: frontend-design
description: >-
  Design new FuelChain web screens with intentional hierarchy, existing tokens,
  and role-aware layouts. Use when creating a page or reshaping UI from scratch
  in apps/web; never invent generic SaaS/Web3 chrome or new backend behavior.
---

# Frontend Design — new screens for FuelChain

## Purpose

Act as design lead for **new or substantially reshaped** screens in `apps/web`. Every layout must feel like FuelChain (logistics / fuel / audit), not a templated dashboard.

## When to use

- Creating a new route/page/component surface
- User asks for a redesign of a whole screen (not light polish)
- Choosing layout structure before coding

## When NOT to use

- Light visual cleanup → `impeccable`
- A11y/form audit only → `web-design-guidelines`
- Flow correctness across steps → `ux-flow-auditor`
- Token/domain canon → always **also** load `fuelchain-design-system`
- Backend / Prisma / contracts / auth / QR crypto

## Workflow

Before designing, answer internally:

```text
Quién usa esta pantalla?
Qué intenta hacer?
Cuál es la acción principal?
Qué información necesita primero?
Qué errores pueden ocurrir?
Qué estados existen?
```

Then:

1. Read `fuelchain-design-system` (tokens, roles, anti-patterns).
2. Search existing components under `apps/web/src/components/` and reuse.
3. Sketch hierarchy (ASCII wireframe ok): header → primary data → primary action → secondary evidence.
4. Build with existing CSS variables and utility classes.
5. Self-critique against AI-generic tells; remove one accessory.

## Rules

### Reuse before inventing

Before new components:

```text
buscar componentes existentes
```

Candidates: `AppShell`, `SupervisionPanel`, `BatchesTable`, `EvidenceVerify`, `LiveAnchorPanel`, `QrScanButton`, `CbbaMap`, forms patterns on `/verify` and `/q`.

### Never auto-generate

```text
sidebar genérico
dashboard genérico
cards genéricas
hero genérico
gradiente violeta
landing SaaS genérica
crypto wallet chrome
Web3 neon dashboard
```

### Domain adaptation

- Operator screens: dense, actionable, Spanish ops language
- Public map (`/mapa`): map-first, citizen-simple
- QR reception (`/q`): one primary accept path
- Evidence/blockchain: secondary panel, not the hero of the page

### Typography & color

Respect current stack (do not swap fonts):

- **Chivo** (`font-display`) — headings, nav emphasis, batch codes, big numbers
- **IBM Plex Sans** — body, tables, metadata, forms

Colors: use `globals.css` tokens (`--haze`, `--paper`, `--ink`, `--mute`, `--diesel`, `--seal`, `--alarm`). Do not invent a new palette for one page.

### Composition

- One job per section; one primary CTA
- Prefer sheets/tables over card grids for operational lists
- Numbers with units and `tabular-nums`
- Status = label (+ icon) + color

### Motion

Use sparingly; prefer existing `.fc-reveal`. Respect reduced motion.

## Checklist

- [ ] Who / job / primary action answered
- [ ] Existing components reused where possible
- [ ] Tokens from design system only
- [ ] Role-appropriate density and nav expectations
- [ ] States planned (loading/empty/error/success/denied)
- [ ] Not generic SaaS / purple / wallet UI
- [ ] Mobile primary task works

## Output expectations

- Brief design rationale (2–4 sentences)
- What was reused vs new
- Explicit non-goals (what you did **not** change in backend)
