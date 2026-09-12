---
name: impeccable
description: >-
  Polish existing FuelChain web screens for visual hierarchy, spacing, typography,
  density, contrast, responsive layout, states, and affordances without changing
  business logic. Use when refining UI, removing AI-generic look, or tightening
  an already-built page in apps/web.
---

# Impeccable — visual polish for FuelChain

## Purpose

Improve how existing screens *look and feel* while preserving domain semantics, copy, and flows. Prefer small, deliberate layout and token fixes over redesigns.

## When to use

- User asks to polish, tighten, clean up, or “make it look less AI”
- A screen works but feels uneven (spacing, hierarchy, density)
- After a functional change, before calling the UI “done”
- Pair with `fuelchain-design-system` when unsure about tokens

## When NOT to use

- New screen from scratch → `frontend-design` + `fuelchain-design-system`
- Accessibility / form / navigation audit → `web-design-guidelines`
- End-to-end flow review → `ux-flow-auditor`
- Any API, Prisma, auth, QR protocol, or blockchain logic change

## Workflow

1. Identify the screen’s **one primary job** and primary CTA.
2. Inventory existing tokens/classes in `apps/web/src/app/globals.css` (`--ink`, `--paper`, `--diesel`, `--seal`, `--alarm`, `.fc-sheet`, `.fc-stamp`, `.fc-table`, `.fc-btn`).
3. Fix hierarchy first (title → supporting → metadata → actions), then spacing, then decoration.
4. Check mobile / tablet / desktop quickly.
5. Report what changed and what was left alone on purpose.

## Rules

### Philosophy

```text
clean
deliberate
professional
usable
information-dense where appropriate
```

### Always improve

- Visual hierarchy (one clear primary action)
- Spacing rhythm (consistent gaps; avoid random `mt-*` stacks)
- Typography roles (Chivo display vs IBM Plex body)
- Alignment of columns, labels, numbers
- Density appropriate to ops screens (not sparse marketing)
- Contrast (text on `--haze` / `--paper`)
- Responsive wrapping of nav, tables, forms
- Visible states: loading / empty / error / success / disabled
- Composition: one job per section
- Consistency with shell (`AppShell`) and sibling pages
- Affordances: buttons look clickable; links look like links
- Accessibility basics while polishing (focus, labels already present)
- Motion: prefer existing `.fc-reveal`; respect `prefers-reduced-motion`

### Detect and avoid (AI-generic UI)

```text
UI genérica de IA
cards within cards
unnecessary borders
gradients without reason
arbitrary glassmorphism
excessive shadows
buttons without hierarchy
inconsistent spacing
weak typography
generic SaaS dashboards
purple-on-white / purple-indigo themes
warm cream + terracotta cliché (unless already the FuelChain diesel accent in context)
identical rounded card grids
ALL-CAPS eyebrow spam
```

### FuelChain-specific polish

- Prefer `.fc-sheet` / border-ink language over nested card stacks
- Numbers: tabular nums + unit (`24 800 L`)
- Status: never color alone — pair with label (and icon when present)
- Blockchain panels stay secondary to operational content
- Do not invent new color tokens in polish passes; reuse CSS variables

## Checklist

- [ ] Primary CTA is obvious within one glance
- [ ] Spacing uses a consistent scale (e.g. 8/12/16/24)
- [ ] Headings use `font-display` (Chivo); body/forms use Plex
- [ ] No decorative borders/shadows that don’t encode structure
- [ ] Empty / error / loading states remain readable
- [ ] Mobile: no horizontal trap except intentional tables/nav scroll
- [ ] Focus rings still visible (`:focus-visible` diesel)
- [ ] No business copy or role menus changed unless asked

## Output expectations

- Short list of visual fixes applied (file paths)
- Note any leftover issues that need `ux-flow-auditor` or a11y audit
- Explicit: **no backend / Prisma / contract changes**
