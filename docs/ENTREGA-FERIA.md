# Checklist entrega — Ethereum Bolivia 2026

## Antes del Demo Day

- [ ] `docker compose up -d postgres`
- [ ] `pnpm db:migrate` && `pnpm db:seed`
- [ ] `pnpm demo:up` (o API + web)
- [ ] Flujo: `chofer@` emite QR → `estacion@` acepta en `/q` → mapa / liquidaciones
- [ ] HSK configurado (`docs/hsk-feria.md`) y `/blockchain/status` live
- [ ] Video ≤ 3 min subido
- [ ] Repo público sin `.env`
- [ ] Devfolio Bolivia (track HSK)
- [ ] Devfolio EAG Global (doble postulación)
- [ ] Dirección del contrato en el formulario

## Credenciales DEMO

| Actor | Email | Pass |
|-------|-------|------|
| Chofer | chofer@fuelchain.bo | demo123 |
| Estación | estacion@fuelchain.bo | demo123 |
| ANH | anh@fuelchain.bo | demo123 |
| Ciudadano | /mapa sin login | — |

## Frase clave

> No tokenizamos el diésel. Anclamos la evidencia del movimiento en HSK para que sea verificable.

## Docs

- Pitch operativo: `docs/demo.md`
- Integración HSK: `docs/hsk-feria.md`
