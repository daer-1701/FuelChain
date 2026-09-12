# Checklist entrega — Ethereum Bolivia 2026

## Foco del pitch

> Cantidad y calidad en cada tramo del camino.  
> No tokenizamos el diésel. Anclamos la evidencia del recorrido en HSK.

## Antes del Demo Day

- [ ] `docker compose up -d postgres`
- [ ] `pnpm db:migrate` && `pnpm db:seed`
- [ ] `pnpm demo:up` (o API + web)
- [ ] Flujo: `chofer@` emite QR → registra **tramo** en `/tramos` → `estacion@` acepta en `/q` → ANH ve camino → mapa
- [ ] HSK configurado (`docs/hsk-feria.md`) y `/blockchain/status` live
- [ ] Video ≤ 3 min subido (centrarse en tramos + verificación)
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

## Docs

- Pitch operativo: `docs/demo.md`
- Integración HSK: `docs/hsk-feria.md`
