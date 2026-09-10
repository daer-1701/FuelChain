/**
 * Demo narrative checklist (PHASE 1 stub — full runner in PHASE 23).
 * Batch FC-BO-2026-000184 HIGH RISK path for judges.
 */

const steps = [
  '1. Create batch FC-BO-2026-000184 — 100,000 L',
  '2. Register documents (origin, quality, transport)',
  '3. Reception 99,900 L',
  '4. Storage 98,700 L',
  '5. ESP32/SIMULATOR 98,650 L',
  '6. Detect volume discrepancy (ANOMALY)',
  '7. Risk Engine → ~82 HIGH',
  '8. AI explains anomaly',
  '9. Anchor anomaly on-chain',
  '10. Auditor opens Audit Case',
  '11. Show document hash',
  '12. Show transaction hash',
];

console.log('[DEMO] FuelChain Bolivia — narrative checklist\n');
for (const step of steps) console.log(step);
console.log('\n[DEMO] Executable runner lands in PHASE 23.');
