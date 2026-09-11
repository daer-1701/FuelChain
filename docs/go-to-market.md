# FuelChain — Enfoque comercial vendible (Bolivia)

**Fecha:** 2026-09-11  
**Estado:** Propuesta de producto / GTM · mezcla `OFFICIAL / VERIFIED` (marco público) + `FUELCHAIN ABSTRACTION` (modelo comercial)  
**Regla:** FuelChain **no** es YPFB, ANH ni B-SISA. No inventa APIs oficiales.

---

## 1. Qué cambió en el mercado (por qué ahora sí se vende)

### Hechos de contexto (`OFFICIAL / VERIFIED` vía norma / cobertura pública)

1. **Escasez y presión de abastecimiento** empujaron a abrir la importación/comercialización privada de diésel y gasolina (p. ej. D.S. **5271**/2024 y reglamentos posteriores reportados: RM **128/2026**, RA ANH **0033/2026**).
2. El trámite de autorización de importación se canaliza por **VUCE** (ANH + Aduana; acceso Ciudadanía Digital / AGETIC).
3. La ANH regula **estaciones de servicio y puestos de venta**, y exige sistemas de comercialización (**B-SISA**) para transmisión de datos de venta.
4. YPFB sigue siendo actor central en la cadena subvencionada y refuerza controles de cisternas / despacho; hay interés público de cruzar visibilidad con ANH.
5. Norma de importación privada insiste en **diferenciar** producto importado por privados vs. producto subvencionado de YPFB.

### Dolor real que paga

| Quién | Dolor | Por qué paga |
|-------|-------|--------------|
| **Importador privado / comercializador** | Debe demostrar origen, autorización, calidad, ruta y que no mezcla con subvencionado | Evitar sanciones, retenciones, reputación, acceso a financiamiento |
| **Red de surtidores / EESS** | Recibe cisternas, administra tanques, vende al público; fiscalización ANH/YPFB | Probar que el stock vendido es el autorizado; menos disputas de volumen |
| **Flotas / agro / minería (consumo propio)** | Importan o compran grandes volúmenes | Auditoría interna + cumplimiento |
| **ANH (no necesariamente “cliente de pago” al inicio)** | Fiscalizar muchos privados nuevos + EESS | Portal de verificación read-only acelera adopción |

---

## 2. Cadena física (simplificada) — dónde se inserta FuelChain

```text
Origen / proveedor
  → Autorización ANH (+ previas) vía VUCE
  → Internación aduanera
  → Depósito / PAHL / tanque propio
  → Cisterna autorizada
  → Estación de servicio / puesto de venta (surtidor)
  → Despacho al consumidor (B-SISA / nota fiscal)
```

**FuelChain no reemplaza B-SISA** (facturación y transmisión de ventas).  
**FuelChain cubre el “antes y alrededor” del despacho:** lote → custodia → medición → discrepancia → evidencia.

Etiqueta del diagrama: logística = `DEMO / ASSUMPTION` operativa; existencia de actores/trámites = `OFFICIAL / VERIFIED`.

---

## 3. Posicionamiento vendible (una frase)

> **FuelChain es el pasaporte digital del combustible importado y despachado en red: cada lote, cada cisterna, cada tanque de estación, cada evidencia — para que el surtidor venda con respaldo y el regulador pueda verificar sin depender de Excel.**

Tagline comercial complementario:

> *Del permiso al surtidor. Verificable.*

---

## 4. Modelo multi-cliente (cómo vender a varios)

### 4.1 Roles de producto (`FUELCHAIN ABSTRACTION`)

| Rol | Quién | Qué ve / hace | Monetización |
|-----|-------|----------------|--------------|
| **Operator (tenant)** | Importador, distribuidor, cadena de EESS | Carga lotes, custodia, tanques, discrepancias, anclas | **SaaS mensual** por organización + volumen |
| **Station** | Surtidor / EESS afiliado al tenant | Recibe cisternas, confirma tanque, ve stock del lote | Incluido en plan del tenant o fee por estación |
| **Verifier** | ANH / auditor externo / banco | Read-only: verificar lote, hash, autorización referida, brecha | Freemium regulatorio o licencia institucional |
| **Carrier** (opcional) | Transportista | Eventos de tránsito / entrega | Add-on |

**Multi-tenant:** cada cliente (empresa) es un `Organization` aislado.  
Los surtidores pertenecen a una org o se comparten bajo contrato (red).  
ANH **no ve datos privados por defecto**; solo lo que el operador **publica/comparte** para verificación (código de lote + evidencia).

### 4.2 Qué se vende exactamente (paquetes)

1. **FuelChain Import** — importadores privados (autorización → depósito).  
2. **FuelChain Station** — redes de surtidores (recepción → tanque → listo para venta).  
3. **FuelChain Verify** — portal verificador (QR / código de lote).  
4. **FuelChain Evidence** — anclas blockchain (opcional premium).

### 4.3 Precio orientativo DEMO (no cotización real)

| Plan | Incluye | Precio sugerido (DEMO) |
|------|---------|------------------------|
| Starter | 1 org, hasta 3 estaciones, 10 lotes/mes | Bajo / land |
| Network | N estaciones, reconciliación, anomalías | Medio |
| Regulated | + Verify público + evidencia on-chain | Alto |

---

## 5. Por qué el surtidor es el cliente correcto (y no solo el importador)

1. **Hay muchos más surtidores que importadores** → mercado repetible.  
2. El surtidor es el **punto de tensión pública** (filas, fiscalización, denuncias).  
3. El surtidor necesita probar: “este volumen en tanque corresponde a lote X autorizado”.  
4. Encaja con la obligación de operar con sistemas de gestión / B-SISA: FuelChain es **capa de integridad de abastecimiento**, no competencia de facturación.  
5. Upsell natural: cadena de estaciones → tenant grande.

### Pitch al dueño de estación (30 s)

> “Cuando llega la cisterna, registrás el lote, el volumen recibido y el tanque. Si mañana te fiscalizan, mostrás el pasaporte: autorización referida, custodia, medición y hash. No te acusamos de nada: te damos evidencia para defender tu operación.”

### Pitch a ANH / verificador (30 s)

> “No reemplazamos B-SISA ni VUCE. Damos un visor de integridad: si el operador comparte un lote, ustedes verifican la cadena documental y las anclas sin entrar a su sistema operacional.”

---

## 6. Diferenciación clara (evitar pelear con el Estado)

| Sistema | Qué hace | FuelChain |
|---------|----------|-----------|
| **VUCE** | Trámite de autorización de importación | Referencia el nº de autorización (no lo sustituye) |
| **SIREHIDRO** | Registro de actores ANH | Guarda ID/registro del operador (referencia) |
| **B-SISA** | Comercialización / notas fiscales / transmisión venta | **No compite**; se integra después vía export/API si hay vía lícita |
| **YPFB monitoreo cisternas** | Asignaciones y rutas de red estatal | Complementario para **canal privado** / redes mixtas |
| **FuelChain** | Pasaporte + reconciliación + evidencia | Capa vendible B2B |

---

## 7. Historia de producto alineada al cierre de venta

### Journey “permiso → surtidor”

1. Operador crea **lote** con volumen autorizado / producto / origen.  
2. Adjunta **referencias** (N° autorización ANH/VUCE, docs de calidad) — hashes, no PDFs “oficiales inventados”.  
3. Eventos de **custodia** hasta estación.  
4. Estación confirma **recepción en tanque** (medición SIMULATOR/IoT/manual).  
5. Si hay brecha → **discrepancia** (no “robo”).  
6. Opcional: **anclar evidencia**.  
7. Genera **QR Verify** para inspector/ANH/cliente mayorista.

Eso es exactamente lo que ya demuestra el lote `FC-BO-2026-000184`, reetiquetado como “entrega a estación”.

---

## 8. Go-to-market en Bolivia (orden práctico)

### Fase A — Land (0–3 meses)
- 3–5 **cadenas de estaciones** o importadores privados piloto (Santa Cruz / La Paz).  
- Enfoque: recepción de cisterna + pasaporte + verify QR.  
- ANH: conversación de **sandbox verificador**, sin prometer integración oficial.

### Fase B — Expand
- Onboarding multi-estación.  
- Reportes de brechas por red.  
- Evidencia on-chain como upsell.

### Fase C — Ecosystem
- Conectores opcionales (export CSV hacia procesos de compliance).  
- Solo entonces explorar interoperabilidad formal (si hay convenio).

**No hacer primero:** vender “somos el sistema de la ANH”. Eso mata credibilidad.

---

## 9. Objeciones y respuestas

| Objeción | Respuesta |
|----------|-----------|
| “Ya existe B-SISA” | B-SISA es comercialización. FuelChain es integridad del abastecimiento y del lote. |
| “YPFB ya rastrea cisternas” | Perfecto para red estatal. El boom de **privados** necesita la misma disciplina. |
| “Blockchain es humo” | No prueba litros. Prueba que el hash del evento existía; útil entre varios actores. |
| “ANH no va a comprar software” | Puede no pagar al inicio. El verificador gratuito aumenta valor para quien sí paga (operadores). |

---

## 10. Implicaciones para el producto actual (roadmap corto)

Para que el discurso sea creíble en demo/jurado **sin fingir APIs**:

1. Renombrar narrativa UI: **Estación / Surtidor** como destino de custodia.  
2. Multi-tenant mínimo: `Organization` + estaciones.  
3. Rol **Verifier** read-only (código de lote / QR).  
4. Campo “autorización ANH/VUCE (referencia)” ya parcialmente modelado → mostrarlo fuerte en pasaporte.  
5. Etiqueta visible: producto **privado importado** vs **canal YPFB** (solo como clasificación DEMO).

---

## 11. Fuentes públicas consultadas (no exhaustivo)

- Cobertura CNC / prensa sobre RM 128/2026 y RA ANH 0033/2026 (importación y comercialización privada vía VUCE).  
- Comunicados ANH–Aduana sobre formulario VUCE de autorización de carburantes.  
- D.S. 5271/2024 (autorización excepcional importación/comercialización privada).  
- Sitio ANH: normativa EESS, B-SISA (RAN-ANH-DJ-UGJN N° 0017/2023 y actualizaciones técnicas).  
- Bolivia Verifica / YPFB: ruta del combustible hasta surtidores; controles de calidad y monitoreo.

Verificar siempre textos íntegros en Gaceta / ANH antes de claims legales en contratos comerciales.

---

## 12. Veredicto

El enfoque más vendible **no** es “plataforma única del Estado”.

Es:

> **SaaS B2B multi-estación** para el canal de combustible **importado/comercializado por privados**, con  
> **surtidores como usuarios diarios**,  
> **importadores/redes como pagadores**, y  
> **ANH como verificador externo** que legitima el producto sin ser el buyer inicial.

Eso aprovecha la apertura regulatoria real, respeta B-SISA/VUCE, y convierte FuelChain en algo que se puede vender repetidamente.
