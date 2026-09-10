# ESP32 — FuelChain (diferido)

**Estado:** no se implementa en el ciclo actual. Queda para **futuro**.

El modelo de datos ya contempla mediciones con `source`:

- `SIMULATOR`
- `MANUAL`
- `ESP32` (cuando se retome)

Firmware stub y simulador MQTT pueden permanecer en el repo como placeholders; **no son prioridad** hasta que se reactive esta línea.

Cuando se retome: WiFi → MQTT topic `fuelchain/tanks/{tankId}/measurements` → API → reconciliación.

**DEMO / ASSUMPTION:** no es hardware industrial certificado.
