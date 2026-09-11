# Importación de carburantes a Bolivia — foco Chile / Arica

**Fecha:** 2026-09-11  
**Propósito:** documentar la cadena **física + administrativa** más relevante para FuelChain, sin inventar APIs estatales.  
**Regla de etiquetas:** `OFFICIAL / VERIFIED` · `REPORTADO (prensa/YPFB)` · `DEMO / ASSUMPTION` · `FUELCHAIN ABSTRACTION`

---

## 1. Idea clave (lo que pediste)

Gran parte del diésel y la gasolina que consumen los bolivianos **no llega por barco a un puerto boliviano** (Bolivia no tiene costa). El patrón dominante reportado por YPFB es:

```text
Buque tanque (alta mar / orígenes diversos)
  → Terminal Marítima Sica Sica (Arica, Chile) — concesión YPFB
  → Ducto submarino / subterráneo → Terminal Terrestre Arica (tanques)
  → Camiones cisterna → plantas / depósitos YPFB en Bolivia
  → Despacho a EESS (surtidores)
```

YPFB ha descrito públicamente a **Arica como el punto de entrega principal** por **volumen y costo** frente a otras rutas (Paraguay, Argentina, Brasil, Perú).  
Etiqueta: `REPORTADO (YPFB / prensa especializada)`.

---

## 2. Terminal Sica Sica — Arica (infraestructura)

| Elemento | Qué es | Etiqueta / fuente |
|----------|--------|-------------------|
| **Terminal Marítimo Sica Sica** | Terminal petrolero **multiboyas** en zona El Chinchorro (Arica) | `OFFICIAL / VERIFIED` (ficha DIRECTEMAR Chile) |
| **Operador** | **YPFB Transporte S.A.** (subsidiaria) | `REPORTADO (YPFB)` |
| **Concesión marítima** | Renovada (~2022–2023) por **20 años** (D.S. Chile Nº 250) sobre playa/fondo de mar para cañería submarina | `REPORTADO (YPFB / PortalPortuario)` — verificar texto en Diario Oficial Chile |
| **Origen histórico** | Acuerdo oleoducto Sica Sica–Arica (1957) en marco bilateral Chile–Bolivia | `REPORTADO` |
| **Amarre** | Campo de boyas; buque se amarra y se conecta a línea submarina (buzos / hose flexible) | `OFFICIAL / VERIFIED` (DIRECTEMAR) + `REPORTADO` operativo |
| **Ducto** | Línea submarina + tramos a tierra hacia tanques de la terminal terrestre | `OFFICIAL / VERIFIED` (DIRECTEMAR); longitudes citadas varían según tramo (flexible vs cañería) |
| **Límites de nave (ficha pública)** | Calado máx. ~11,88 m; eslora máx. ~189,9 m; desplazamiento máx. ~50.000 t | `OFFICIAL / VERIFIED` (DIRECTEMAR) |
| **Productos** | Históricamente: descarga de diésel / derivados; también crudo / operaciones de Recon según época | `REPORTADO` |
| **Restricciones** | Marejadas, mareas, mantenimiento de boyas → ventanas meteorológicas retrasan amarres | `REPORTADO` (cobertura 2024–2026) |

**OSSA-2 / oleoducto:** existe la infraestructura histórica Sica Sica–Arica (oleoducto). YPFB ha mencionado usar cisternas desde Arica y, en algunos mensajes, el potencial del oleoducto para abaratar logística hacia Oruro / Cochabamba / Santa Cruz. Eso **no** implica que todo el producto DEMO viaje por ducto; el modo dominante reportado hacia el mercado interno de carburantes listos es **cisterna**. Etiqueta: `REPORTADO` + cuidado de no mezclar crudo vs gasolina/diésel terminado.

---

## 3. Cadena operativa paso a paso

```text
1. CONTRATACIÓN / PROGRAMACIÓN DE CARGA
   YPFB (o modalidad privada autorizada) programa buques / volúmenes.
   Etiqueta marco: OFFICIAL (YPFB importa según Ley 3058) + DEMO en FuelChain.

2. TRÁNSITO MARÍTIMO
   Buque tanque llega a bahía de Arica (origen del cargamento: diverso;
   en cobertura aparecen puertos de varios continentes). No inventar origen fijo.

3. AMARRE EN SICA SICA
   Ventana climática / de marea → amarre a boyas → conexión a ducto.

4. DESCARGA A TANQUES (Terminal Terrestre Arica)
   Litros bombeados a almacenamiento en Arica (Chile).
   Aquí nace un “lote físico” enorme (decenas de millones de litros por buque).

5. DESPACHO A CISTERNAS
   Isla de carga gasolina / diésel → flota de cisternas (órdenes de magnitud
   reportadas: ~80–110 cisternas/día en comunicados YPFB de años recientes;
   picos mayores en crisis). Cada cisterna = eslabón de custodia.

6. DOCUMENTACIÓN TRANSFRONTERIZA
   Trámites aduaneros / DIM y papeles asociados. Retrasos documentales
   pueden dejar cisternas varadas en Arica (reportado en prensa 2026).

7. INGRESO A BOLIVIA + PLANTAS YPFB
   Destino: plantas de almacenaje / distribución regionales
   (La Paz, Oruro, Cochabamba, Santa Cruz, etc. según programación).

8. DESPACHO PLANTA → EESS
   ANH fiscaliza tramo planta→surtidor (según mensajes oficiales 2026
   sobre roles YPFB vs ANH). B-SISA aparece en discurso regulatorio;
   FuelChain NO replica B-SISA.
```

### Por qué importan los QR / offline en FuelChain

Entre Arica y el valle (p. ej. Cochabamba) hay **tramos de mala señal**, peajes, colas y traspasos chofer↔estación. El “bastón QR” modela la custodia **cisterna a cisterna / cisterna a EESS** cuando el buque ya quedó atrás.

---

## 4. Otros puntos de entrega (diversificación)

YPFB reporta una red de orígenes/puntos, no solo Arica:

| País / nodo (reportado) | Rol típico en narrativa YPFB |
|-------------------------|------------------------------|
| **Chile — Arica (Sica Sica)** | Principal por volumen/costo |
| **Chile — Iquique, Mejillones** | Alternativas / complementos |
| **Argentina — Campana, Zárate** | Entrega terrestre / regional |
| **Paraguay — San Antonio** | Alternativa fluvial/terrestre |
| **Perú — Lima, Pisco, Mollendo** | Alternativas del Pacífico |

Etiqueta: `REPORTADO (YPFB / ABI / prensa)`. Volúmenes exactos día a día **no** se fijan en FuelChain.

---

## 5. Marco administrativo (importación legal)

Complementa `docs/bolivia-fuel-process.md`:

| Capa | Actor | Función pública conocida |
|------|-------|--------------------------|
| Marco legal | Ley **3058** | Importación de hidrocarburos vía YPFB (por sí o contratos) |
| Autorización | **ANH** + reglamentos MHE / D.S. | Autorizar importación de carburantes (también vías privadas en marcos excepcionales) |
| Comercio exterior | **VUCE** + Aduana | Formulario / ventanilla; no inventar campos |
| Operación | **YPFB / YPFB Transporte** | Buque → Arica → cisternas → plantas |
| Fiscalización planta→surtidor | **ANH** (según mensajes de gobierno 2026) | Controles, calidad, sistemas (B-SISA citado en intervención) |

**Importación privada:** hay normativa y cobertura 2024–2026 sobre importación privada de diésel/gasolina (precio internacional, cupos, requisitos). FuelChain puede modelar un `importer` privado DEMO **sin** afirmar que es el régimen vigente exacto de un día dado.

---

## 6. Volúmenes (órdenes de magnitud — no KPIs oficiales del producto)

Cobertura reciente (2025–2026) menciona operaciones del orden de:

- **~20–50 millones de litros** por buque / descarga puntual en Sica Sica  
- Programaciones de **varios buques** en ventanas de días  
- Despachos diarios desde Arica del orden de **millones de litros** vía cisternas  

Etiqueta: `REPORTADO`. En el seed DEMO usamos lotes mucho más chicos (`FC-BO-2026-…`) para que el pasaporte sea legible.

---

## 7. Riesgos reales que FuelChain sí puede narrar (sin acusar)

| Riesgo operativo | Cómo aparece en producto |
|------------------|--------------------------|
| Retraso por marea / boya | Evento `IN_TRANSIT` prolongado + nota DEMO |
| Gap volumen buque ↔ tanque Arica ↔ suma cisternas | Escalera de reconciliación |
| Cisterna varada por papeles (DIM) | Documento faltante / anomalía `DOCUMENTATION` |
| Diferencia planta ↔ EESS | Discrepancia de volumen + auditoría |
| Sin señal en ruta Arica–CBBA | Bastón QR offline |

**Nunca** etiquetar automáticamente como “robo” o “corrupción”.

---

## 8. Mapeo a entidades FuelChain

| Realidad | FuelChain |
|----------|-----------|
| Buque / descarga Sica Sica | `CustodyEvent` `LOADED` / `IN_TRANSIT` + `Transport` (tipo `WATER` o `OTHER` al tramo marítimo) |
| Tanque Arica | `StorageTank` (ubicación Chile DEMO) o solo metadata |
| Cisterna individual | `Vehicle` + `CustodyBaton` + `cisternCode` |
| Ingreso Bolivia / aduana | `CustomsEvent` + `Document` |
| Planta regional | `CustodyEvent` `RECEIVED` / `STORED` |
| EESS Cochabamba | `Station` + medición tanque |
| Hash de evidencia | `BlockchainAnchor` (no prueba litros físicos) |

---

## 9. Corredor DEMO Cochabamba (abstracción)

```text
[DEMO] Buque → Sica Sica / Arica
     → Cisterna CIS-CBB-07
     → Ruta terrestre (Arica–La Paz–Oruro–CBBA u otra programación)
     → EESS ST-CBB-xx en valle de Cochabamba
     → Mapa público /mapa
```

Etiqueta del corredor completo: `FUELCHAIN ABSTRACTION` sobre hechos `REPORTADO` de Arica como hub.

---

## 10. Fuentes (investigación abierta)

- DIRECTEMAR (Chile) — ficha Terminal Marítimo Sica Sica (PDF público)  
- Comunicados / cobertura YPFB sobre Terminal Arica, cisternas/día, concesión D.S. 250  
- PortalPortuario / BNamericas / ABI / prensa boliviana 2024–2026 (descargas de buques, ventanas climáticas, cisternas varadas por DIM)  
- `docs/bolivia-fuel-process.md` — marco ANH / VUCE / Ley 3058  

*No sustituye dictamen legal ni datos operativos en tiempo real de YPFB/ANH.*
