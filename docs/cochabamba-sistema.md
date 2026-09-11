# FuelChain Cochabamba — Sistema completo + offline/QR

**Región:** Cochabamba, Bolivia  
**Fecha:** 2026-09-11  
**Estado:** Diseño + implementación DEMO en monorepo  
**Regla:** No inventar APIs ANH. Hardware en tanque = Ex-safe en producción; ESP32 solo gateway zona segura o SIMULATOR en demo.

---

## 1. Por qué Cochabamba

- Ciudad + valle con alta demanda de estaciones (Cercado, Quillacollo, Sacaba, Tiquipaya, Vinto…).
- Entrada de combustible por rutas terrestres (p. ej. ejes hacia Santa Cruz / Oruro / La Paz) con **tramos de mala señal**.
- Ciudadanos sufren incertidumbre de abastecimiento → mapa público tiene valor inmediato.
- Redes privadas de importación/comercialización necesitan prueba de custodia **sin depender de 4G continuo**.

---

## 2. Cómo guardamos la información de cisternas **sin señal**

### Idea clave: **bastón digital (Custody Baton) por QR**

No intentamos subir telemetría en tiempo real en la montaña.  
Cada traspaso de custodia (depósito→cisterna, cisterna→estación) genera un **QR firmado** que el siguiente actor lee con el celular.

```text
Sin señal:
  Actor A genera evento en el teléfono (offline)
       → firma local / bastón
       → muestra QR
  Actor B escanea QR
       → valida hash + firma
       → guarda evento en cola local del teléfono
       → confirma recepción en pantalla

Con señal (después):
  Ambos teléfonos sincronizan cola → API FuelChain
       → servidor valida cadena (prevHash → hash)
       → persiste CustodyEvent + Baton + Measurement si aplica
```

### Qué va en el QR (compacto)

El QR **no** lleva el historial completo (no cabe). Lleva el **último eslabón**:

| Campo | Ejemplo | Rol |
|-------|---------|-----|
| `id` | token corto | Identificador del bastón |
| `batch` | FC-BO-2026-000184 | Lote |
| `cistern` | CIS-CBB-07 | Cisterna |
| `vol` | 25000 | Litros declarados/transferidos |
| `ev` | IN_TRANSIT / DELIVERED | Tipo de evento |
| `ts` | unix | Momento captura offline |
| `ph` | hash previo | Encadena custodia |
| `h` | hash actual | Integridad del payload |
| `s` | HMAC DEMO | Anti-tamper liviano |

URL amigable (cuando hay señal al escanear):  
`/q/{tokenId}` → abre ficha + permite aceptar.

**Payload embebido** (cuando no hay señal al escanear): el QR contiene el JSON/base64url del bastón para validar offline.

### Telemetría del sensor de cisterna sin señal

| Capa | Comportamiento |
|------|----------------|
| Sensor Ex ia en tanque/cisterna | Mide localmente |
| Logger / gateway | Guarda en memoria/SD (**store-and-forward**) |
| Cuando vuelve señal (NB-IoT/4G/WiFi estación) | Sube ráfaga de mediciones |
| Si no hay logger | El celular registra lectura manual + foto + QR al entregar |

**Conclusión:**  
- **Custodia humana** → QR + cola offline en celular.  
- **Sensores** → buffer local del dispositivo, sync diferido.  
- **Servidor** → fuente de verdad al sincronizar; rechaza bastones inválidos/duplicados.

---

## 3. Mapa de actores en Cochabamba (DEMO)

| Código | Actor | Ejemplo |
|--------|-------|---------|
| IMP-CBB | Importador / red | Red DEMO Cochabamba |
| CIS-CBB-xx | Cisterna | Flota local |
| ST-CBB-xx | Estación | Quillacollo, Sacaba, Cala Cala… |
| VER-ANH | Verificador | Portal read-only |
| PUB | Ciudadano | Mapa “Dónde cargar” |

Estaciones DEMO sugeridas (coordenadas aproximadas):

1. ST-CBB-01 — FuelChain Cala Cala (Cercado)  
2. ST-CBB-02 — FuelChain Quillacollo Centro  
3. ST-CBB-03 — FuelChain Sacaba Km 7  
4. ST-CBB-04 — FuelChain Tiquipaya  
5. ST-CBB-05 — FuelChain Vinto  

El público ve semáforo: **Lleno / Medio / Bajo / Sin dato** (nunca litros exactos).

---

## 4. Flujo operativo CBB (con y sin señal)

```text
1. Importación (oficina con WiFi)
   → lote + ref. autorización ANH/VUCE + docs

2. Carga a cisterna (depósito)
   → medición / declaración volumen
   → emite QR bastón IN_TRANSIT
   → chofer escanea (aunque luego pierda señal)

3. Ruta Cochabamba (poca señal)
   → teléfono del chofer guarda bastón + GPS esporádico
   → logger de cisterna bufferiza nivel si existe

4. Llegada a estación (puede haber WiFi del surtidor)
   → personal escanea QR del chofer
   → acepta DELIVERED / RECEIVED
   → tanque de estación confirma litros (sensor o manual)
   → sync automático

5. Ciudadano
   → abre /mapa
   → ve disponibilidad agregada en CBB

6. ANH / auditor
   → /verify o QR de lote
   → pasaporte + bastones sincronizados
```

---

## 5. Seguridad explosiva (recordatorio CBB)

- Interior tanque/vapor: solo **Ex ia / ATEX-IECEx**.  
- Celular del operador: **fuera** de zona de llenado activa (procedimiento: apagar cerca de bocas según SOP estación).  
- El QR se lee en zona segura (oficina de playa / a distancia reglamentaria).  
- DEMO: SIMULATOR; producción: instalador autorizado.

---

## 6. Qué implementa el monorepo en esta iteración

- Modelo `Station`, `CustodyBaton`, `OfflineSyncEvent`
- API pública de estaciones Cochabamba (`GET /stations/public?city=Cochabamba`)
- API emitir / aceptar bastón QR + sync offline (`/custody-qr/*`)
- UI `/mapa` (ciudadanos CBB) · alias `/cochabamba`
- UI `/q/[token]` (aceptar bastón)
- UI `/verify` (emitir QR + sync cola offline)
- Seed estaciones Cochabamba (`ST-CBB-01` … `ST-CBB-06` + cisterna `CIS-CBB-07`)

---

## 7. Frase para el jurado (Cochabamba)

> “En Cochabamba la cisterna no siempre tiene señal. Por eso la custodia viaja en un QR firmado de celular a celular, se guarda offline y se sincroniza al llegar a la estación. El tanque reporta cantidad con sensor seguro; el ciudadano ve en el mapa dónde cargar; la ANH puede verificar el pasaporte.”
