/**
 * FuelChain IoT measurement simulator.
 * Publishes DEMO payloads to MQTT — no physical ESP32 required.
 * Requires: docker compose --profile iot up -d mosquitto
 *
 * Topic: fuelchain/tanks/{tankId}/measurements
 */

import mqtt from 'mqtt';

const MQTT_URL = process.env.MQTT_URL ?? 'mqtt://localhost:1883';
const TANK_ID = process.env.TANK_ID ?? 'TANK-001';
const DEVICE_ID = process.env.DEVICE_ID ?? 'ESP32-TANK-001';
const INTERVAL_MS = Number(process.env.INTERVAL_MS ?? 5000);
const BASE_VOLUME = Number(process.env.VOLUME_LITERS ?? 98650);

const topic = `fuelchain/tanks/${TANK_ID}/measurements`;

console.log(`[DEMO] FuelChain IoT simulator → ${MQTT_URL}`);
console.log(`[DEMO] topic=${topic} device=${DEVICE_ID}`);

const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
  console.log('[DEMO] MQTT connected');
  setInterval(() => {
    const jitter = Math.round((Math.random() - 0.5) * 20);
    const payload = {
      deviceId: DEVICE_ID,
      tankId: TANK_ID,
      volumeLiters: BASE_VOLUME + jitter,
      temperature: Number((22 + Math.random() * 4).toFixed(1)),
      timestamp: new Date().toISOString(),
      source: 'SIMULATOR',
      label: 'DEMO',
    };
    client.publish(topic, JSON.stringify(payload), { qos: 0 }, (err) => {
      if (err) console.error('[DEMO] publish error', err);
      else console.log('[DEMO] published', payload.volumeLiters, 'L');
    });
  }, INTERVAL_MS);
});

client.on('error', (err) => {
  console.error('[DEMO] MQTT error — is Mosquitto running? (`docker compose up -d mosquitto`)', err.message);
});
