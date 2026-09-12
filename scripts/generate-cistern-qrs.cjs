/**
 * Genera 50 PNG de QR (sticker cisterna) para escanear en estación.
 * Uso:
 *   pnpm qr:cisternas
 *   $env:WEB_ORIGIN="http://192.168.x.x:3000"; pnpm qr:cisternas
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const root = path.resolve(__dirname, '..');
const webRoot = path.join(root, 'apps', 'web');

function requireFrom(dir, id) {
  const req = Module.createRequire(path.join(dir, 'package.json'));
  return req(id);
}

const QRCode = requireFrom(webRoot, 'qrcode');

const outDir = path.join(webRoot, 'public', 'qr-cisternas');
const origin = (
  process.env.WEB_ORIGIN ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');

fs.mkdirSync(outDir, { recursive: true });

const stickers = [];
for (let i = 1; i <= 50; i++) {
  const num = String(i).padStart(2, '0');
  const code = `CIS-CBB-${num}`;
  const qrToken = `CQ-CBB-${num}`;
  const deviceId = `GW-${code}`;
  const deepLink = `${origin}/c/${qrToken}`;
  stickers.push({ code, qrToken, deviceId, deepLink });
}

(async () => {
  const manifest = [];
  for (const s of stickers) {
    const file = `${s.qrToken}.png`;
    const filePath = path.join(outDir, file);
    await QRCode.toFile(filePath, s.deepLink, {
      type: 'png',
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0b1220', light: '#ffffff' },
    });
    manifest.push({
      ...s,
      image: `/qr-cisternas/${file}`,
    });
    console.log(`OK ${s.qrToken} → ${s.deepLink}`);
  }

  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify({ origin, count: manifest.length, stickers: manifest }, null, 2),
    'utf8',
  );

  const cards = manifest
    .map(
      (s) => `
    <article class="card">
      <img src="./${s.qrToken}.png" alt="${s.qrToken}" width="180" height="180" />
      <h2>${s.code}</h2>
      <p class="mono">${s.qrToken}</p>
      <p class="mono muted">${s.deviceId}</p>
      <p class="url">${s.deepLink}</p>
    </article>`,
    )
    .join('\n');

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>FuelChain — 50 QR cisterna</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #0b1220; }
    h1 { margin: 0 0 8px; }
    .meta { color: #556; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .card { border: 1px solid #c9d0d8; padding: 12px; text-align: center; break-inside: avoid; }
    .card img { display: block; margin: 0 auto 8px; }
    .mono { font-family: ui-monospace, monospace; font-size: 12px; margin: 2px 0; }
    .muted { color: #667; }
    .url { font-size: 10px; word-break: break-all; color: #445; }
    @media print {
      body { margin: 8mm; }
      .meta a { display: none; }
      .card { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>50 QR de cisterna — FuelChain DEMO</h1>
  <p class="meta">Origen: ${origin}. Escaneá con la cámara de la app (Mi estación / 50 QR) o abrí el link. Luego: <strong>Subir camino</strong>.</p>
  <div class="grid">${cards}</div>
</body>
</html>`;

  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  console.log(`\nListo: ${manifest.length} PNG en ${outDir}`);
  console.log(`Imprimible: ${path.join(outDir, 'index.html')}`);
  console.log(`Web: ${origin}/qr-cisternas/index.html`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
