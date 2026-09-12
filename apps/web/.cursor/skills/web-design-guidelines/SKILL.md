---
name: web-design-guidelines
description: >-
  Audit FuelChain apps/web UI for accessibility, forms, UX states, responsive
  layout, navigation, and action feedback. Use when reviewing a11y, checking
  forms, or auditing UX quality without redesigning visuals or changing business
  logic.
---

# Web Design Guidelines — auditor for FuelChain

## Purpose

Act as a **reviewer**, not a redesign agent. Find concrete UX/a11y issues in existing screens and recommend minimal fixes that preserve FuelChain semantics.

Inspired by Vercel Web Interface Guidelines and standard a11y practice; adapted to FuelChain ops UI (Spanish copy, role menus, QR/custody flows).

## When to use

- “Review my UI”, “check accessibility”, “audit design/UX”
- Forms feel broken (labels, errors, disabled, loading)
- Missing empty/error/permission states
- Navigation dead ends or ambiguous CTAs
- After implementing a feature, before polish (`impeccable`)

## When NOT to use

- Brand-new page invention → `frontend-design`
- Token / domain visual rules → `fuelchain-design-system`
- Multi-step flow correctness → `ux-flow-auditor`
- Backend, auth, Prisma, blockchain protocol work

## Workflow

1. Scope files/routes the user named (or ask).
2. Walk **Accessibility → Forms → States → Responsive → Navigation → Feedback**.
3. Report findings as `path:line` (or component + issue) with severity.
4. Suggest the smallest fix; do not rewrite the screen unless asked.

Optional: if network is available, refresh external Web Interface Guidelines for extra checks — but **FuelChain rules below win** on conflict.

## Rules

### Accessibility

- Keyboard: all actions reachable; no mouse-only traps
- Focus visible (project uses diesel outline in `globals.css`)
- Labels: every input has a visible `<label>` or `aria-label`
- Semantic HTML: headings order, `nav`, `main`, lists, `button` vs `div`
- Contrast: ink on paper/haze; mute text only for secondary info
- ARIA only when native HTML is insufficient
- Never rely on color alone for status (pair with text / icon)

### Forms

- Visible labels (not placeholder-only)
- Validation messages next to the field when possible
- Error language in Spanish, specific, actionable
- Disabled vs loading clearly distinct
- Success confirmation after submit
- `autocomplete` where browsers help (login, etc.)
- Primary submit not ambiguous (“Aceptar”, “Generar QR”, not “Enviar” genérico if context is clear)

### UX states

Every important screen should consider:

```text
loading
empty
error
success
disabled
permission denied
```

FuelChain extras:

```text
offline / cola sync (QR)
PENDING / FAILED blockchain anchor
role cannot perform action (show home link)
```

### Responsive

Review:

```text
desktop
tablet
mobile
```

- Operator nav already scrolls horizontally — keep usable
- Tables: allow overflow-x; don’t crush critical columns
- Map pages: map first; panels must not fully cover map on mobile
- Touch targets for QR / GPS actions must be large enough

### Navigation

Detect:

- Dead ends (no way back / no next step)
- Actions without return path
- Inconsistent nav vs `role-access.ts`
- Ambiguous CTAs (“Continuar”, “OK” without object)
- Public routes (`/mapa`, `/q/*`) vs operator shell confusion

Source of truth for menus: `apps/web/src/lib/role-access.ts`.

### Feedback

Every important action must make clear:

```text
qué ocurrió
si funcionó
si está pendiente
si falló
qué puede hacer el usuario después
```

Prefer inline messages near the action (existing pattern on `/q`, `/verify`, `/tramos`) over silent success.

## Checklist

- [ ] Keyboard + focus
- [ ] Labels / semantics
- [ ] Contrast / non-color status
- [ ] Form error + loading + disabled
- [ ] loading / empty / error / success / permission
- [ ] Mobile usable for primary task
- [ ] Clear next step after success/failure
- [ ] No invented roles or routes

## Output expectations

Terse audit:

```text
P0 — apps/web/src/app/q/[token]/page.tsx — accept button has no pending label
P1 — ...
OK — ...
```

Do not expand into a full redesign unless requested.
