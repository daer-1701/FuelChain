# Seguridad IoT — tanques y cisternas (gasolina)

**Importante:** vapores de gasolina son **atmósfera explosiva**. Un ESP32 “de maker” **no** se instala dentro del tanque ni en Zona 0 sin certificación.

Etiqueta: guía de diseño FuelChain (`FUELCHAIN ABSTRACTION` + buenas prácticas industriales públicas ATEX/IECEx).

---

## 1. Regla de oro

```text
Zona peligrosa (tanque / boca de carga / cisterna)
  → SOLO sonda certificada (Ex ia / ATEX / IECEx)
  → Barrera de seguridad intrínseca (en gabinete zona segura)
  → Gateway / ESP32 / PLC  (zona segura)
  → FuelChain API
```

**Nunca:** ESP32, baterías LiPo, Wi‑Fi/BT o sparks dentro del vapor del tanque.

---

## 2. Qué usar para cantidad (recomendado)

| Uso | Tecnología | Por qué |
|-----|------------|---------|
| Tanque estación (subterráneo) | **Magnetostrictivo** intrínsecamente seguro (típico EESS) | Precisión alta + detección de agua (interfase) |
| Alternativa | **Radar / ultrasónico Ex ia** + barrera | Sin contacto; requiere modelo certificado Zone 0/1 |
| Cisterna | Nivel certificado + GPS en cabina (zona segura) | Medir volumen en tránsito sin electrificar el compartimento |

Ejemplos de familia industrial (referencia, no endorsement): sensores ultrasónicos IS + barrera Zener/active; magnetostrictivos ATEX Zone 0 para estaciones.

---

## 3. Qué usar para calidad (proxy)

En el mismo punto de medición (o sonda combinada):

- Temperatura  
- Agua / interfase (crítico en estación)  
- Densidad / dieléctrico (si el sensor lo trae)

El **certificado de lab** sigue siendo la evidencia formal de calidad de importación. El sensor vigila desviaciones en tanque/cisterna.

---

## 4. Arquitectura FuelChain (cisterna + surtidor)

```text
Cisterna (en ruta)
  sonda Ex ia → barrera → gateway cabina → Measurement(kind=CISTERN)

Surtidor (tanque)
  sonda Ex ia → barrera en cuarto eléctrico → gateway → Measurement(kind=STATION_TANK)

Público
  /cargar → ve litros disponibles por estación (solo datos publicados)

ANH / verificador
  /verify → pasaporte del lote + referencias de autorización (read-only)
```

---

## 5. Checklist de instalación (DEMO → real)

1. Clasificar zona (0 / 1 / 2) con persona competente.  
2. Elegir sensor con marcado **Ex ia** (o equivalente) compatible con gasolina.  
3. Instalar **barrera IS** en área segura; cableado segregado.  
4. Puesta a tierra / bonding según norma local.  
5. Gateway FuelChain **fuera** de la zona peligrosa.  
6. Documentar modelo, certificado y plano de control.  
7. En hackathon: simular lecturas (`SIMULATOR`) y mostrar el diagrama de seguridad al jurado.

---

## 6. Frase para el jurado

> “Medimos cantidad y proxies de calidad en cisterna y tanque, pero la electrónica inteligente vive en zona segura. En el tanque solo entra una sonda intrínsecamente segura con barrera — porque el vapor de gasolina puede inflamarse.”
