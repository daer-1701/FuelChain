/**
 * Demo narrative checklist for the jury.
 * Run: pnpm --filter @fuelchain/scripts demo:narrative
 */

const steps = [
  'Resumen — volumen en custodia + medidor TANQUE',
  'Lotes — 181 feliz · 182 tránsito · 184 auditoría',
  'Pasaporte 184 — reconciliación Declarado→Recepción→Almacén→Simulador',
  'Discrepancias / Auditorías — señal humana, IA explica',
  'Evidencia — Anclar ahora → txHash real (Hardhat)',
];

console.log('\nFuelChain Bolivia — guion DEMO\n');
steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
console.log('\nURLs: http://localhost:3000  ·  health :3001/health\n');
console.log('Frase: blockchain no prueba litros; prueba el hash del evento.\n');
