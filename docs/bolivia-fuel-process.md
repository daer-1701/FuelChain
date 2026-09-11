# Proceso de combustible importado en Bolivia

**Propósito:** documentar lo verificable públicamente para que FuelChain **no invente** APIs, endpoints ni procedimientos internos estatales.

**Estado:** investigación inicial (PHASE 1) — ampliar con citas a Gaceta Oficial cuando se descarguen PDFs completos.

**Importante:** FuelChain es una **abstracción / plataforma demo**, no una réplica de sistemas de YPFB, ANH o Aduana Nacional.

---

## Etiquetas

| Etiqueta | Significado |
|----------|-------------|
| `OFFICIAL / VERIFIED` | Respaldado por norma o fuente institucional pública citada |
| `DEMO / ASSUMPTION` | Simplificación FuelChain para hackathon |
| `FUELCHAIN ABSTRACTION` | Modelo propio del producto, no oficial |

---

## Actores institucionales (alto nivel)

| Actor | Rol público conocido | Etiqueta |
|-------|----------------------|----------|
| **YPFB** | Empresa estatal de hidrocarburos; la Ley de Hidrocarburos enmarca la importación a través de YPFB (por sí o mediante contratos/asociaciones) | `OFFICIAL / VERIFIED` (marco legal general) |
| **ANH** | Agencia Nacional de Hidrocarburos — regulación / autorizaciones de importación de carburantes | `OFFICIAL / VERIFIED` |
| **Aduana Nacional** | Control aduanero; participación en trámites vía **VUCE** (Ventanilla Única de Comercio Exterior) | `OFFICIAL / VERIFIED` |
| **Ministerio de Hidrocarburos y Energías** | Reglamento ministerial de autorización de importación | `OFFICIAL / VERIFIED` (existencia del reglamento reportada) |
| **Viceministerio de Defensa Social y Sustancias Controladas** | Autorización previa de importación (mencionada en decretos) | `OFFICIAL / VERIFIED` (existencia del requisito en norma citada) |
| **AGETIC** | Credenciales de Ciudadanía Digital para acceso a VUCE | `OFFICIAL / VERIFIED` (reportado en cobertura institucional/prensa) |

FuelChain **no** modela APIs internas de estos actores.

---

## Marco normativo citado (público)

Fuentes y referencias encontradas en investigación abierta (verificar siempre en Gaceta Oficial):

| Referencia | Tema | Etiqueta |
|------------|------|----------|
| Ley N° **3058** (17 may 2005) — Ley de Hidrocarburos | Importación de hidrocarburos realizada por YPFB por sí o por contratos/asociaciones, sujeta a reglamentación (Art. 17, referencias públicas) | `OFFICIAL / VERIFIED` |
| D.S. **28419** (21 oct 2005), modificado p. ej. por D.S. **5218** (2024) | Requisitos técnicos/legales y procedimiento de autorización de importación | `OFFICIAL / VERIFIED` (existencia; detalle operativo = leer norma completa) |
| D.S. **5271** / modificaciones posteriores (p. ej. referencias a D.S. **5644** en cobertura 2026) | Marco excepcional / actualización de importación privada de diésel y gasolinas | `OFFICIAL / VERIFIED` (existencia reportada; plazos y excepciones verificar en Gaceta) |
| Resolución Ministerial **128/2026** (MHE) | Reglamento para autorización de importación de carburantes y no carburantes (comercialización o consumo propio) — reportado por prensa/Cámara | `OFFICIAL / VERIFIED` (existencia reportada; texto íntegro pendiente de archivo oficial) |
| Resolución Administrativa **RAN-ANH-DJ-UGJN N° 0033/2026** | Procedimiento ANH para importación/comercialización diésel y gasolina vía VUCE | `OFFICIAL / VERIFIED` (existencia reportada) |

**No inventado aquí:** endpoints, campos exactos de formularios VUCE, tiempos internos de sistemas, ni “APIs oficiales” de ANH/YPFB/Aduana.

---

## Flujo administrativo reportado (simplificado)

```text
Solicitante (público/privado)
    → VUCE (formulario de autorización de importación de carburantes)
    → Autorizaciones (ANH + otras previas según norma)
    → Documentación de calidad / seguro / infraestructura (según requisitos publicados)
    → Operación aduanera / ingreso
    → Comercialización o consumo propio (según autorización)
```

Etiqueta del diagrama: mezcla de `OFFICIAL / VERIFIED` (existencia de VUCE + autorizaciones) y `FUELCHAIN ABSTRACTION` (orden exacto de cada documento en un lote demo).

### Elementos frecuentemente mencionados en requisitos públicos / cobertura

- Autorización ANH  
- Autorización previa (Viceministerio de Defensa Social y Sustancias Controladas)  
- Certificados de calidad del combustible emitidos por el proveedor  
- Póliza de seguro de responsabilidad civil  
- Datos de origen, volúmenes estimados, rutas de ingreso, modalidad de transporte  
- Infraestructura de almacenamiento y distribución  
- Clasificación arancelaria (NANDINA)  
- En algunos casos, acuerdo con YPFB “cuando corresponda”

Etiqueta: `OFFICIAL / VERIFIED` a nivel de **tipos de requisito reportados**; los valores concretos en la app son `DEMO`.

### Documentos de calidad (norma / decreto — referencias públicas)

Decretos citados mencionan aceptación, en ciertos casos, de:

- Certificado de Calidad (con condiciones de homologación / momento de presentación)  
- Certificado de Ensayo  
- Informe de Ensayo  

emitidos por Organismo de Evaluación de la Conformidad acreditado en el país de origen (detalle exacto = texto oficial).

FuelChain modela `QualityCertificate`, `SamplingEvent`, `LabAnalysis` como **`FUELCHAIN ABSTRACTION`** con parámetros JSON flexibles — **no** como parámetros regulatorios inventados.

---

## Cadena logística física

Bolivia **no tiene puerto soberano**. La importación marítima de carburantes se apoya en terminales de terceros países. El hub más citado por YPFB por volumen/costo es **Arica (Chile) — Terminal Marítima Sica Sica**.

Detalle ampliado (infraestructura, boyas, ducto, cisternas, riesgos):  
→ **`docs/importacion-chile-arica.md`**

### Corredor principal reportado (Chile)

```text
Buque tanque
  → Terminal Marítima Sica Sica (Arica, CL) — YPFB Transporte
  → Ducto submarino → Terminal Terrestre Arica (tanques)
  → Camiones cisterna
  → Plantas / depósitos YPFB en Bolivia
  → Estaciones de servicio (EESS)
```

| Tramo | Modalidad | Etiqueta |
|-------|-----------|----------|
| Alta mar → Arica | Buque | `REPORTADO` |
| Boyas → tanques Arica | Ducto submarino (concesión) | `OFFICIAL / VERIFIED` (ficha portuaria) + `REPORTADO` (operador YPFB) |
| Arica → Bolivia | Cisterna / camión | `REPORTADO` (modo dominante carburantes listos) |
| Planta → EESS | Cisterna | `REPORTADO` |
| Alternativa oleoducto OSSA-2 | Ducto (crudo / logística histórica) | `REPORTADO` — no asumir que reemplaza cisternas de gasolina/diésel en todo el flujo |

### Otros puntos de entrega reportados por YPFB

Chile (Iquique, Mejillones), Argentina (Campana, Zárate), Paraguay (San Antonio), Perú (Lima, Pisco, Mollendo).  
Arica suele presentarse como **principal**; el resto diversifica riesgo.

### En el modelo FuelChain

| Modalidad | Enum | Uso DEMO |
|-----------|------|----------|
| Cisterna / camión | `TransportType.TRUCK` | Tramo Arica→Bolivia / planta→EESS |
| Fluvial / marítimo | `WATER` | Tramo buque (metadata) |
| Ferrocarril | `RAIL` | Opcional |
| Ducto | `PIPELINE` | Opcional (no default DEMO) |
| Otros | `OTHER` | — |

Almacenamiento, despacho y distribución a estaciones = eventos de custodia (`FUELCHAIN ABSTRACTION`), no réplica de un sistema YPFB/B-SISA.

**Documentación fronteriza:** retrasos por papeles (p. ej. DIM citado en prensa) se modelan como anomalías `DOCUMENTATION`, nunca como “contrabando automático”.

---

## Muestreo, laboratorio y certificación

| Tema | Qué sabemos | Etiqueta |
|------|-------------|----------|
| Existen certificados / ensayos de calidad en el marco de importación | Sí (norma / cobertura) | `OFFICIAL / VERIFIED` |
| Parámetros físico-químicos exactos obligatorios por producto en UI | **No fijados en este doc** | — |
| Valores y laboratorios en seed | Ficticios | `DEMO / ASSUMPTION` |
| Tolerancias de volumen oficiales | **No inventadas** | usar solo umbrales DEMO documentados en `risk-engine.md` |

---

## Qué FuelChain NO afirma

- Que reproduce VUCE, sistemas ANH, YPFB o Aduana.  
- Que blockchain demuestra existencia física de litros.  
- Que ESP32 es medición industrial certificada.  
- Que una discrepancia = robo o corrupción.

---

## Mapeo a abstracción FuelChain

| Concepto real (alto nivel) | Entidad FuelChain | Etiqueta |
|----------------------------|-------------------|----------|
| Lote / cargamento importado | `FuelBatch` | `FUELCHAIN ABSTRACTION` |
| Autorización de importación | `ImportAuthorization` | `FUELCHAIN ABSTRACTION` |
| Documento aduanero / transporte / calidad | `Document` (+ tipos) | `FUELCHAIN ABSTRACTION` |
| Movimiento / custodia | `CustodyEvent` | `FUELCHAIN ABSTRACTION` |
| Medición de tanque | `Measurement` | `DEMO` (IoT) |

---

## Pendientes de verificación (próximas iteraciones)

1. Descargar y citar PDFs oficiales de RM 128/2026 y RA ANH 0033/2026 desde fuentes .gob.bo.  
2. Confirmar en Gaceta el texto vigente de D.S. 5644 / 5271 y plazos de autorización.  
3. Separar claramente requisitos de **comercialización** vs **consumo propio**.  
4. No añadir “APIs oficiales” salvo URL pública documentada.

---

## Fuentes consultadas (investigación abierta)

- Cobertura CNC / prensa sobre RM 128/2026 y VUCE  
- Energiabolivia / La Razón — formulario VUCE (jul, cobertura 2026)  
- Documentos ANH / Gaceta (PDF y gacetaoficialdebolivia.gob.bo) referenciando Ley 3058, D.S. 28419, 5218, 5271  
- **Cadena Chile:** DIRECTEMAR (Terminal Sica Sica), comunicados YPFB / PortalPortuario / BNamericas sobre Arica, concesión marítima, cisternas — ver `docs/importacion-chile-arica.md`

*Actualizar este archivo cuando se incorpore el texto íntegro de cada norma.*
