# FuelChain Completo — Visión de sistema vendible

**Fecha:** 2026-09-11  
**Tagline:** *Del permiso al surtidor. Verificable.*  
**Alcance:** importación → ANH/verify → cisternas → tanques de estación → mapa público de disponibilidad  
**Etiquetas:** mezcla `OFFICIAL / VERIFIED` (marco BO) + `FUELCHAIN ABSTRACTION` (producto) + `DEMO` (hackathon)

> FuelChain **no** reemplaza VUCE, SIREHIDRO, B-SISA ni YPFB.  
> Es la **capa de integridad + inventario en vivo** que une importadores, surtidores, público y verificadores.

---

## 1. Qué problema resolvemos (una historia)

Hoy en Bolivia conviven:

- cadena estatal (YPFB + fiscalización),
- **importación/comercialización privada** abierta/reglamentada,
- estaciones (EESS) reguladas por ANH con **B-SISA** en ventas,
- ciudadanos que no saben **dónde hay combustible**.

FuelChain conecta tres dolores en un solo producto:

1. **Operador / surtidor:** probar origen, cantidad y calidad del stock.  
2. **ANH / auditor:** verificar sin Excel ni visita ciega.  
3. **Conductor:** ver disponibilidad aproximada por estación y cargar.

---

## 2. Actores del sistema

```text
[Importador / red] ──paga──► FuelChain Cloud (multi-tenant)
        │
        ├── Cisternas (IoT Ex-safe)
        ├── Estaciones / surtidores (IoT Ex-safe + app operador)
        │
[ANH / Verificador] ──read-only──► Portal Verify
[Ciudadano] ──gratis/freemium──► App / web “Dónde cargar”
```

| Actor | App | Función |
|-------|-----|---------|
| Importador / dueño de red | Consola Operator | Lotes, autorizaciones, cisternas, estaciones, discrepancias, evidencia |
| Personal de estación | App Station | Recibir cisterna, confirmar tanque, ver alarmas |
| Transportista | App Carrier (opcional) | Eventos de tránsito / geocerca |
| ANH / auditor / banco | Portal Verify | QR / código lote / estación (solo lectura) |
| Público | Mapa FuelChain | Disponibilidad por estación (agregada, no milimétrica) |

---

## 3. Cadena de valor completa (qué cubre el producto)

```text
1. Autorización (referencia ANH/VUCE)
2. Lote importado (FuelBatch)
3. Calidad documental (certificado + hash)
4. Carga a cisterna (sensor cantidad ± proxy calidad)
5. Tránsito (GPS + sellos de evento)
6. Descarga en estación (match cisterna → tanque)
7. Inventario de tanque (sensor Ex-safe continuo)
8. Discrepancias (volumen / calidad proxy)
9. Evidencia on-chain (opcional)
10. Publicación a mapa ciudadano (nivel agregado)
11. Venta al surtidor (B-SISA sigue siendo de ellos)
```

### Módulos vendibles

| Módulo | Qué hace | Quién lo compra |
|--------|----------|-----------------|
| **Import Desk** | Lotes, docs, autorización referida, aduana/custodia | Importadores |
| **Fleet Cistern** | Telemetría de cisterna + entrega | Redes / transportistas |
| **Station Tank** | Inventario + alarmas de tanque | Cadenas de EESS |
| **Quality Proxy** | Densidad/dieléctrico/agua/T° (no lab) | Add-on |
| **Verify** | Portal regulador/auditor | Land gratuito → upsell |
| **Public Map** | “Dónde hay gasolina” | Adquisición de usuarios + B2B branding |
| **Evidence Chain** | Anclas blockchain | Premium compliance |

---

## 4. Sensores: cantidad + calidad (y cómo no explotar)

### 4.1 Principio de seguridad (obligatorio)

El vapor de gasolina crea **atmósfera explosiva**. Dentro/cerca del tanque o boca de cisterna suele tratarse como zona peligrosa (en estándares internacionales: **Zona 0/1**).

**Nunca** metas un ESP32 “casero”, batería suelta o WiFi no certificado **dentro** del espacio de vapor.

| Enfoque | Qué es | Uso |
|---------|--------|-----|
| **Seguridad intrínseca (Ex ia)** | Energía tan baja que no puede inflamar aunque falle | Preferido en Zona 0 (interior de tanque / vapor) |
| **A prueba de explosión (Ex d)** | Caja robusta que contiene la explosión | Más para equipos grandes en Zona 1/2 |
| **Barrera / aislador** | Separa zona peligrosa ↔ zona segura | Obligatoria con lazos Ex ia |
| **Head remoto** | Sensor Ex en tanque; gateway fuera de zona | Arquitectura recomendada |

Referencias de mercado: sensores ultrasónicos **ATEX / IECEx Ex ia** para nivel de tanques (p. ej. familias tipo TEK Exi, APG MNU IS).  
Instalación real: ingeniero de áreas clasificadas + norma local aplicable (Bolivia: seguir criterio ANH / bomberos / instalador autorizado de EESS).

### 4.2 Dónde va cada equipo

```text
ZONA PELIGROSA (tanque / vapor)
  └─ Solo sensor certificado Ex ia (nivel ± calidad proxy)
           │ cable intrínsecamente seguro
ZONA SEGURA (oficina / rack / poste lejos del surtidor)
  └─ Gateway / ESP32 / 4G / edge FuelChain
           │ MQTT / HTTPS
      FuelChain Cloud
```

### 4.3 Cantidad (litros)

| Ubicación | Sensor recomendado (producción) | DEMO hackathon |
|-----------|----------------------------------|----------------|
| **Tanque estación** | Ultrasónico / radar / magnetostrictivo **Ex ia** | SIMULATOR / mock |
| **Cisterna** | Nivel Ex ia + **GPS** en cabina (fuera de vapor) | SIMULATOR + GPS phone |

Conversión altura → litros con **tabla de aforo** del tanque (calibración).

### 4.4 Calidad (solo proxies)

| Señal | Para qué | Limitación |
|-------|----------|------------|
| Temperatura | Corrección / anomalía térmica | No es “calidad legal” |
| Agua / interfase | Contaminación en tanque | Crítico en estación |
| Densidad / dieléctrico | Cambio de producto / mezcla rara | No mide octanaje |
| Certificado de lab (PDF+hash) | Calidad regulatoria | Obligatorio en importación |

**Mensaje comercial honesto:**  
*Medimos cantidad en vivo y calidad operativa (proxies). La calidad normativa sigue siendo certificado de laboratorio.*

### 4.5 Kit DEMO vs kit REAL

**DEMO (pitch / hackathon)**  
- Simulador MQTT / API de mediciones  
- UI de mapa + pasaporte  
- Etiqueta visible `DEMO — no certificado Ex`

**REAL (piloto pagado)**  
- Sensor de nivel **ATEX/IECEx Ex ia** en tanque  
- Gateway fuera de zona  
- Detector de agua Ex-rated (si aplica)  
- Instalación por técnico autorizado  
- SOP de no-spark / puesta a tierra / permisos de trabajo en caliente

---

## 5. Experiencias de usuario

### 5.1 Público — “Dónde cargar”

- Mapa de estaciones afiliadas  
- Estado: **Con stock / Bajo / Sin datos / Cerrado**  
- Producto: Gasolina especial / Premium / Diésel  
- Actualización: cada X minutos  
- **No** mostrar litros exactos al público (seguridad + competencia + pánico)  
- Mostrar: “Disponible (~lleno / medio / bajo)” derivado del sensor

### 5.2 Estación

- Dashboard de tanques  
- Alerta: bajo nivel, sobrellenado, agua detectada, cisterna en camino  
- Confirmación de descarga (cisterna ID + lote + volumen recibido vs sensor)

### 5.3 Importador / red

- Pasaporte de lote de punta a punta  
- Flota de cisternas  
- KPIs de merma / discrepancias por estación  
- Evidencia anclada

### 5.4 ANH Verify

- Buscar por código de lote / QR de estación  
- Ver: autorización referida, custodia, última medición, anclas  
- Sin editar datos operativos  
- Export PDF de verificación

---

## 6. Arquitectura técnica objetivo

```text
                    ┌──────────── Public Map ────────────┐
                    │  (agregación / semáforos)          │
                    └───────────────▲────────────────────┘
                                    │ read API pública limitada
┌──────────┐   HTTPS    ┌───────────────────────────────┐
│ Gateways │───────────►│     FuelChain API (Nest)      │
│ Ex-safe  │   MQTT     │  multi-tenant · roles · IoT   │
└────▲─────┘            └───────────────┬───────────────┘
     │                                  │
Sensores Ex ia                    PostgreSQL + Prisma
(cisterna/tanque)                       │
                                  Blockchain anchors (opcional)
```

### Datos clave nuevos (respecto al monorepo actual)

- `Organization` (tenant)  
- `Station` (EESS) + geo + horarios + visibilidad pública  
- `Tank` ya existe → ligar fuerte a Station  
- `Cistern` / `Vehicle` + telemetría  
- `Measurement` → cantidad + `temperature` + `waterDetected` + `density` opcional  
- `PublicAvailability` vista materializada (semáforo)  
- Roles: `OPERATOR`, `STATION_STAFF`, `VERIFIER`, `PUBLIC`

---

## 7. Cumplimiento y honestidad regulatoria

| Sistema estatal | Relación FuelChain |
|-----------------|--------------------|
| VUCE / autorización ANH | Guardamos **referencia** del permiso |
| B-SISA | No lo reemplazamos; ventas siguen ahí |
| SIREHIDRO | Referencia de registro del actor |
| YPFB | Canal paralelo; etiquetamos stock privado vs estatal si el cliente lo declara |

Nunca afirmar: “integración oficial ANH vía API secreta” sin convenio.

---

## 8. Modelo de negocio

| Ingreso | Cómo |
|---------|------|
| SaaS por organización | Mensual |
| Fee por estación conectada | Por tanque/sensor activo |
| Hardware + instalación | Margen o partner Ex-certified |
| Evidence premium | Anclas blockchain |
| Public Map white-label | Marca de la red (“estaciones verificadas FuelChain”) |
| Licencia Verify institucional | ANH / municipios / bancos (fase 2) |

---

## 9. Roadmap de lo que **podemos hacer**

### Ya casi listo en el repo (base)
- Lotes, custodia, passport, reconciliación de volumen  
- Anomalías / auditorías  
- Anclado blockchain demo  
- Mediciones SIMULATOR  
- Docs de GTM / proceso BO  

### P0 — Demo vendible (1–2 sprints)
1. Multi-estación + mapa público (semáforos)  
2. Flujo cisterna → tanque (entrega)  
3. UI “Cantidad / Calidad proxy”  
4. Portal Verify por QR  
5. Narrativa Importación → Estación (sin fingir API ANH)  

### P1 — Piloto real
6. Integración gateway + sensor **Ex ia** (1 tanque piloto)  
7. Alarmas agua / bajo nivel  
8. Tabla de aforo por tanque  
9. App móvil estación  
10. Onboarding multi-tenant  

### P2 — Escala
11. Flota cisternas con geocerca  
12. Partner de instalación Ex en BO  
13. Export compliance / PDF inspector  
14. Opcional conector B-SISA **solo si hay vía legal**  
15. Testnet / evidencia productiva  

---

## 10. Respuesta directa: explosión

**Sí puede ser peligroso** meter electrónica no certificada en tanque/cisterna de gasolina.

**Prevención recomendada:**
1. Clasificar zona (0/1/2) con instalador.  
2. Usar sensores **intrínsecamente seguros Ex ia** (ATEX/IECEx).  
3. Gateway **fuera** de la zona de vapor.  
4. Barreras de seguridad intrínseca en el lazo.  
5. Puesta a tierra, no chispas, permisos de trabajo.  
6. En demo: **SIMULATOR** o banco de pruebas con agua — etiquetado DEMO.

El ESP32 del repo queda como **gateway en zona segura** o stub; **no** como sonda dentro del tanque.

---

## 11. Pitch de 60 segundos (jurado / cliente)

> FuelChain digitaliza la cadena del combustible importado hasta el surtidor.  
> El importador registra el lote y la autorización.  
> La cisterna y el tanque de la estación reportan **cantidad** (y proxies de calidad) con sensores **seguros para área explosiva**.  
> Si hay merma o agua, generamos una **discrepancia** para auditoría — no una acusación.  
> La ANH puede **verificar** el pasaporte.  
> El ciudadano ve en el mapa **dónde hay combustible**.  
> B-SISA sigue cobrando la venta; nosotros hacemos que el stock sea **trazable y visible**.

---

## 12. Conclusión

El sistema completo y vendible es:

> **Plataforma multi-tenant de integridad + inventario en vivo**  
> para importadores y redes de surtidores,  
> con verificador regulatorio y mapa ciudadano,  
> midiendo **cantidad y calidad proxy** con hardware **Ex-safe**,  
> sin pretender ser el Estado ni reemplazar B-SISA.

Eso une todo lo investigado (importación privada, ANH, EESS, escasez, sensores, seguridad) en un producto que se puede vender por estaciones, no solo como demos de un lote.
