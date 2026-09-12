/**
 * FuelChain Bolivia — DEMO seed (PHASE 4)
 *
 * ALL data is DEMO / FUELCHAIN ABSTRACTION — not official government data.
 * ESP32 hardware is deferred; tank reading uses source=SIMULATOR (same demo volume).
 */

import {
  PrismaClient,
  BatchStatus,
  RiskLevel,
  QualityStatus,
  CustodyEventType,
  TransportType,
  TransportStatus,
  AuthorizationStatus,
  DocumentType,
  CertificateStatus,
  LabResultStatus,
  AnomalyType,
  AnomalySeverity,
  AnomalyStatus,
  AuditCaseStatus,
  MeasurementSource,
  ActorRole,
  TankStatus,
  StationAvailability,
  BatonStatus,
  CisternStatus,
  DeliveryStatus,
} from '@prisma/client';
import { createHash, randomBytes, scryptSync } from 'crypto';
import { resolve } from 'path';
import { readFileSync } from 'fs';

function loadEnvFiles() {
  for (const p of [resolve(__dirname, '.env'), resolve(__dirname, '../.env')]) {
    try {
      const text = readFileSync(p, 'utf8');
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      }
    } catch {
      // optional
    }
  }
}

loadEnvFiles();

const prisma = new PrismaClient();

function demoHash(input: string): string {
  return createHash('sha256').update(`FUELCHAIN-DEMO:${input}`).digest('hex');
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

/** DEMO password — same algorithm as AuthService (scrypt salt:hash). */
function demoPasswordHash(password = 'demo123'): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Estaciones DEMO en los 9 departamentos de Bolivia.
 * Inventario 100% DEMO — no es feed oficial ANH Abastecimiento.
 */
async function seedBoliviaStations() {
  type TankDef = {
    tankName: string;
    capacity: number;
    fillLiters: number | null;
    waterDetected: boolean;
    temp: number | null;
    productHint?: string;
  };
  type StationDef = {
    code: string;
    name: string;
    city: string;
    municipality: string;
    address: string;
    latitude: number;
    longitude: number;
    products: string[];
    tanks: TankDef[];
  };

  const defs: StationDef[] = [
    {
      code: 'ST-CBB-01',
      name: 'EESS Cala Cala',
      city: 'Cochabamba',
      municipality: 'Cercado',
      address: 'Av. América — zona Cala Cala',
      latitude: -17.3742,
      longitude: -66.1475,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-CALA-DIESEL',
          capacity: 45000,
          fillLiters: 28600,
          productHint: 'Diésel Oil',
          waterDetected: false,
          temp: 21.2,
        },
        {
          tankName: 'TANK-CALA-GAS',
          capacity: 32000,
          fillLiters: 12400,
          productHint: 'Gasolina Especial',
          waterDetected: false,
          temp: 20.8,
        },
      ],
    },
    {
      code: 'ST-CBB-02',
      name: 'Surtidor Virgen de Guadalupe',
      city: 'Cochabamba',
      municipality: 'Quillacollo',
      address: 'Av. Albina Patiño — Quillacollo',
      latitude: -17.3978,
      longitude: -66.2789,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-QLLO-VG',
          capacity: 40000,
          fillLiters: 17500,
          waterDetected: false,
          temp: 22.0,
        },
      ],
    },
    {
      code: 'ST-CBB-03',
      name: 'Trans Sacaba',
      city: 'Cochabamba',
      municipality: 'Sacaba',
      address: 'Calle Ayacucho — Sacaba',
      latitude: -17.4041,
      longitude: -66.0418,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-SAC-01',
          capacity: 38000,
          fillLiters: 5100,
          waterDetected: false,
          temp: 23.1,
        },
      ],
    },
    {
      code: 'ST-CBB-04',
      name: 'Señor de Santiago / Mayorazgo',
      city: 'Cochabamba',
      municipality: 'Cercado',
      address: 'Av. Melchor Pérez de Olguín',
      latitude: -17.3668,
      longitude: -66.1742,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-MAY-01',
          capacity: 35000,
          fillLiters: 16200,
          waterDetected: false,
          temp: 21.8,
        },
      ],
    },
    {
      code: 'ST-CBB-05',
      name: 'El Viajero / Vinto',
      city: 'Cochabamba',
      municipality: 'Vinto',
      address: 'Av. Albina Patiño esq. Rosas — Vinto',
      latitude: -17.3935,
      longitude: -66.3178,
      products: ['Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-VIN-01',
          capacity: 28000,
          fillLiters: 600,
          waterDetected: false,
          temp: 22.6,
        },
      ],
    },
    {
      code: 'ST-CBB-06',
      name: 'Surtidor Nissan / Av. Petrolera',
      city: 'Cochabamba',
      municipality: 'Cercado',
      address: 'Av. Petrolera Km 1',
      latitude: -17.4285,
      longitude: -66.1648,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-PET-01',
          capacity: 42000,
          fillLiters: 35100,
          waterDetected: false,
          temp: 24.0,
        },
      ],
    },
    {
      code: 'ST-CBB-07',
      name: 'Pana Gas / Blanco Galindo',
      city: 'Cochabamba',
      municipality: 'Quillacollo',
      address: 'Av. Blanco Galindo Km 12,5',
      latitude: -17.3862,
      longitude: -66.2685,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-BG-01',
          capacity: 40000,
          fillLiters: 19800,
          waterDetected: false,
          temp: 22.3,
        },
      ],
    },
    {
      code: 'ST-CBB-08',
      name: 'Gasolinera Rioja',
      city: 'Cochabamba',
      municipality: 'Cercado',
      address: 'Av. Petrolera Km 4,5',
      latitude: -17.4412,
      longitude: -66.1525,
      products: ['Gasolina Especial'],
      tanks: [
        {
          tankName: 'TANK-RIO-01',
          capacity: 30000,
          fillLiters: 3800,
          waterDetected: true,
          temp: 23.4,
        },
      ],
    },
    {
      code: 'ST-CBB-09',
      name: 'Iquircollo',
      city: 'Cochabamba',
      municipality: 'Quillacollo',
      address: 'Av. Blanco Galindo Km 11 1/2',
      latitude: -17.3895,
      longitude: -66.2552,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-IQ-01',
          capacity: 36000,
          fillLiters: 30100,
          waterDetected: false,
          temp: 21.9,
        },
      ],
    },
    {
      code: 'ST-CBB-10',
      name: 'Estación Ayacucho Centro',
      city: 'Cochabamba',
      municipality: 'Cercado',
      address: 'Av. Ayacucho zona central norte',
      latitude: -17.3858,
      longitude: -66.1562,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-AYA-01',
          capacity: 32000,
          fillLiters: null,
          waterDetected: false,
          temp: null,
        },
      ],
    },
    // —— Resto de Bolivia ——
    {
      code: 'ST-LPZ-01',
      name: 'EESS El Alto Ceja',
      city: 'La Paz',
      municipality: 'El Alto',
      address: 'Av. 6 de Marzo — Ceja',
      latitude: -16.5085,
      longitude: -68.1628,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-EA-01',
          capacity: 50000,
          fillLiters: 22000,
          waterDetected: false,
          temp: 12.5,
        },
      ],
    },
    {
      code: 'ST-LPZ-02',
      name: 'Surtidor Sopocachi',
      city: 'La Paz',
      municipality: 'La Paz',
      address: 'Av. 6 de Agosto — Sopocachi',
      latitude: -16.5102,
      longitude: -68.1285,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-SOP-01',
          capacity: 38000,
          fillLiters: 9100,
          waterDetected: false,
          temp: 14.1,
        },
      ],
    },
    {
      code: 'ST-SCZ-01',
      name: 'EESS Equipetrol',
      city: 'Santa Cruz',
      municipality: 'Santa Cruz de la Sierra',
      address: 'Av. San Martín — Equipetrol',
      latitude: -17.7558,
      longitude: -63.1985,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-EQ-01',
          capacity: 55000,
          fillLiters: 41200,
          waterDetected: false,
          temp: 28.2,
        },
      ],
    },
    {
      code: 'ST-SCZ-02',
      name: 'Surtidor Doble Vía La Guardia',
      city: 'Santa Cruz',
      municipality: 'La Guardia',
      address: 'Doble Vía La Guardia Km 8',
      latitude: -17.8895,
      longitude: -63.3212,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-LG-01',
          capacity: 42000,
          fillLiters: 7800,
          waterDetected: false,
          temp: 29.0,
        },
      ],
    },
    {
      code: 'ST-ORU-01',
      name: 'EESS Oruro Centro',
      city: 'Oruro',
      municipality: 'Oruro',
      address: 'Av. 6 de Agosto — centro',
      latitude: -17.9833,
      longitude: -67.15,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-ORU-01',
          capacity: 36000,
          fillLiters: 15400,
          waterDetected: false,
          temp: 18.4,
        },
      ],
    },
    {
      code: 'ST-PTS-01',
      name: 'Surtidor Potosí Norte',
      city: 'Potosí',
      municipality: 'Potosí',
      address: 'Av. Universitaria',
      latitude: -19.5723,
      longitude: -65.755,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-PTS-01',
          capacity: 30000,
          fillLiters: 4200,
          waterDetected: false,
          temp: 11.8,
        },
      ],
    },
    {
      code: 'ST-TJA-01',
      name: 'EESS Tarija Sur',
      city: 'Tarija',
      municipality: 'Tarija',
      address: 'Av. La Paz — zona sur',
      latitude: -21.5355,
      longitude: -64.7296,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-TJA-01',
          capacity: 40000,
          fillLiters: 26800,
          waterDetected: false,
          temp: 24.6,
        },
      ],
    },
    {
      code: 'ST-CHQ-01',
      name: 'Surtidor Sucre Centro',
      city: 'Chuquisaca',
      municipality: 'Sucre',
      address: 'Av. Japón — zona central',
      latitude: -19.0333,
      longitude: -65.2627,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-SUC-01',
          capacity: 34000,
          fillLiters: 18900,
          waterDetected: false,
          temp: 20.1,
        },
      ],
    },
    {
      code: 'ST-BEN-01',
      name: 'EESS Trinidad',
      city: 'Beni',
      municipality: 'Trinidad',
      address: 'Av. 6 de Agosto — Trinidad',
      latitude: -14.8333,
      longitude: -64.9,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-TRI-01',
          capacity: 32000,
          fillLiters: 11200,
          waterDetected: false,
          temp: 27.5,
        },
      ],
    },
    {
      code: 'ST-PND-01',
      name: 'Surtidor Cobija',
      city: 'Pando',
      municipality: 'Cobija',
      address: 'Av. 9 de Febrero',
      latitude: -11.0267,
      longitude: -68.7692,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tanks: [
        {
          tankName: 'TANK-COB-01',
          capacity: 28000,
          fillLiters: 6400,
          waterDetected: false,
          temp: 26.8,
        },
      ],
    },
  ];

  const created = [];
  for (const d of defs) {
    const primaryFill = d.tanks[0]?.fillLiters ?? null;
    const primaryCap = d.tanks[0]?.capacity ?? 1;
    const station = await prisma.station.create({
      data: {
        code: d.code,
        name: d.name,
        city: d.city,
        municipality: d.municipality,
        address: d.address,
        latitude: d.latitude,
        longitude: d.longitude,
        publicVisible: true,
        availability:
          primaryFill == null
            ? StationAvailability.UNKNOWN
            : primaryFill / primaryCap >= 0.7
              ? StationAvailability.FULL
              : primaryFill / primaryCap >= 0.35
                ? StationAvailability.MEDIUM
                : primaryFill / primaryCap > 0.05
                  ? StationAvailability.LOW
                  : StationAvailability.EMPTY,
        products: d.products,
        lastInventoryAt: primaryFill != null ? hoursAgo(2) : null,
        isDemo: true,
      },
    });

    for (const t of d.tanks) {
      if (t.fillLiters != null && t.fillLiters > t.capacity) {
        throw new Error(
          `Seed inventory overflow ${d.code}/${t.tankName}: ${t.fillLiters} > ${t.capacity}`,
        );
      }

      const tank = await prisma.storageTank.create({
        data: {
          name: t.tankName,
          capacityLiters: t.capacity,
          currentStockLiters: t.fillLiters ?? 0,
          location: `${d.name} — ${d.city}`,
          stationId: station.id,
          status:
            t.fillLiters != null && t.fillLiters / t.capacity <= 0.05
              ? TankStatus.AVAILABLE
              : TankStatus.IN_USE,
          isDemo: true,
        },
      });

      if (t.fillLiters != null) {
        await prisma.measurement.create({
          data: {
            tankId: tank.id,
            deviceId: `SIM-${d.city.slice(0, 3).toUpperCase()}-${d.code}-${t.tankName}`,
            volumeLiters: t.fillLiters,
            temperature: t.temp ?? undefined,
            waterDetected: t.waterDetected,
            density: 0.745 + (t.waterDetected ? 0.06 : 0.01),
            source: MeasurementSource.SIMULATOR,
            timestamp: hoursAgo(2),
            isDemo: true,
          },
        });
      }
    }

    created.push(station);
  }

  return created;
}

async function resetDemo() {
  // Cascades from FuelBatch cover most relations; clear independents first where needed
  await prisma.auditNote.deleteMany();
  await prisma.auditCase.deleteMany();
  await prisma.anomaly.deleteMany();
  await prisma.blockchainAnchor.deleteMany();
  await prisma.measurement.deleteMany();
  await prisma.labAnalysis.deleteMany();
  await prisma.samplingEvent.deleteMany();
  await prisma.qualityCertificate.deleteMany();
  await prisma.importAuthorization.deleteMany();
  await prisma.customsEvent.deleteMany();
  await prisma.custodyEvent.deleteMany();
  await prisma.custodyBaton.deleteMany();
  await prisma.routeCheckpoint.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.cistern.deleteMany();
  await prisma.offlineSyncEvent.deleteMany();
  await prisma.transport.deleteMany();
  await prisma.document.deleteMany();
  await prisma.fuelBatch.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.storageTank.deleteMany();
  await prisma.station.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('[DEMO] Seeding FuelChain Bolivia…');
  await resetDemo();

  const pw = demoPasswordHash('demo123');

  const auditor = await prisma.user.create({
    data: {
      email: 'auditor@fuelchain.bo',
      name: 'Auditor DEMO',
      role: ActorRole.AUDITOR,
      passwordHash: pw,
      walletAddress: '0xDEMOauditor00000000000000000000000001',
      isDemo: true,
    },
  });

  const importer = await prisma.user.create({
    data: {
      email: 'importador@fuelchain.bo',
      name: 'Importador DEMO CBBA',
      role: ActorRole.IMPORTER,
      passwordHash: demoPasswordHash('demo123'),
      isDemo: true,
    },
  });

  const transporter = await prisma.user.create({
    data: {
      email: 'chofer@fuelchain.bo',
      name: 'Chofer cisterna DEMO',
      role: ActorRole.TRANSPORTER,
      passwordHash: demoPasswordHash('demo123'),
      isDemo: true,
    },
  });

  const depot = await prisma.user.create({
    data: {
      email: 'deposito@fuelchain.bo',
      name: 'Operador Depósito DEMO',
      role: ActorRole.DEPOT_OPERATOR,
      passwordHash: demoPasswordHash('demo123'),
      isDemo: true,
    },
  });

  const labUser = await prisma.user.create({
    data: {
      email: 'lab@fuelchain.bo',
      name: 'Laboratorio DEMO',
      role: ActorRole.LAB,
      passwordHash: demoPasswordHash('demo123'),
      isDemo: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'estacion@fuelchain.bo',
      name: 'Encargado EESS Cala Cala',
      role: ActorRole.STATION_STAFF,
      passwordHash: demoPasswordHash('demo123'),
      isDemo: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'anh@fuelchain.bo',
      name: 'ANH — verificación de movimientos',
      role: ActorRole.VERIFIER,
      passwordHash: demoPasswordHash('demo123'),
      isDemo: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'ciudadano@fuelchain.bo',
      name: 'Ciudadano mapa CBBA',
      role: ActorRole.CITIZEN,
      passwordHash: demoPasswordHash('demo123'),
      isDemo: true,
    },
  });

  // legacy aliases used in older docs
  await prisma.user.create({
    data: {
      email: 'auditor.demo@fuelchain.bo',
      name: 'Auditor DEMO (alias)',
      role: ActorRole.AUDITOR,
      passwordHash: demoPasswordHash('demo123'),
      isDemo: true,
    },
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      identifier: 'VEH-DEMO-001',
      plate: 'DEMO-1234',
      carrier: 'Transportes DEMO SRL',
      capacityLiters: 50000,
      isDemo: true,
    },
  });

  const tank = await prisma.storageTank.create({
    data: {
      name: 'TANK-001',
      capacityLiters: 200000,
      currentStockLiters: 160000,
      location: 'Depósito DEMO — Santa Cruz (coords ficticias)',
      status: TankStatus.IN_USE,
      isDemo: true,
    },
  });

  const boliviaStations = await seedBoliviaStations();
  const deptCount = new Set(boliviaStations.map((s) => s.city)).size;
  console.log(
    `[DEMO] Estaciones Bolivia: ${boliviaStations.length} en ${deptCount} departamentos`,
  );
  console.log(
    `[DEMO] Códigos: ${boliviaStations.map((s) => s.code).join(', ')}`,
  );

  // Encargado EESS → solo Cala Cala (ST-CBB-01); no ve otras estaciones.
  const homeStation =
    boliviaStations.find((s) => s.code === 'ST-CBB-01') ?? boliviaStations[0];
  await prisma.user.update({
    where: { email: 'estacion@fuelchain.bo' },
    data: { stationId: homeStation.id },
  });
  console.log(
    `[DEMO] estacion@ asignado a ${homeStation.code} (${homeStation.name})`,
  );

  // ─── Batch 1: LOW / CERTIFIED / COMPLETED ──────────────────────────────────
  const batch1 = await prisma.fuelBatch.create({
    data: {
      batchCode: 'FC-BO-2026-000181',
      product: 'Gasolina Especial',
      declaredVolumeLiters: 100000,
      originCountry: 'Argentina',
      destination: 'La Paz, Bolivia',
      supplier: 'Proveedor DEMO AR',
      importer: 'Importador DEMO BO',
      status: BatchStatus.COMPLETED,
      riskScore: 12,
      riskLevel: RiskLevel.LOW,
      qualityStatus: QualityStatus.CERTIFIED,
      currentLocation: 'Estación DEMO — La Paz',
      isDemo: true,
    },
  });

  await seedHappyPath(batch1.id, {
    declared: 100000,
    border: 99980,
    depot: 99950,
    sensor: 99940,
    vehicleId: vehicle.id,
    tankId: tank.id,
    actors: { importer: importer.id, transporter: transporter.id, depot: depot.id, lab: labUser.id },
    destination: 'La Paz, Bolivia',
    completed: true,
  });

  // ─── Batch 2: MEDIUM / IN_TRANSIT — corredor Arica → Cochabamba ────────────
  const batch2 = await prisma.fuelBatch.create({
    data: {
      batchCode: 'FC-BO-2026-000182',
      product: 'Diésel Oil',
      declaredVolumeLiters: 150000,
      originCountry: 'Chile (vía Arica / Sica Sica)',
      destination: 'Cochabamba, Bolivia',
      supplier: 'Cargamento marítimo DEMO',
      importer: 'Importador DEMO BO',
      status: BatchStatus.IN_TRANSIT,
      riskScore: 48,
      riskLevel: RiskLevel.MEDIUM,
      qualityStatus: QualityStatus.PENDING,
      currentLocation:
        'En tránsito DEMO — post Terminal Terrestre Arica → cisternas a CBBA',
      isDemo: true,
    },
  });

  await seedInTransit(batch2.id, {
    declared: 150000,
    vehicleId: vehicle.id,
    actors: { importer: importer.id, transporter: transporter.id },
  });

  // ─── Batch 3: HIGH / AUDIT_REQUIRED — gasolina vía hub Chile (narrativa) ───
  const batch3 = await prisma.fuelBatch.create({
    data: {
      batchCode: 'FC-BO-2026-000184',
      product: 'Gasolina Especial',
      declaredVolumeLiters: 100000,
      originCountry: 'Chile (vía Arica / Sica Sica)',
      destination: 'Santa Cruz, Bolivia',
      supplier: 'Cargamento marítimo DEMO',
      importer: 'Importador DEMO BO',
      status: BatchStatus.AUDIT_REQUIRED,
      riskScore: 82,
      riskLevel: RiskLevel.HIGH,
      qualityStatus: QualityStatus.CERTIFIED,
      currentLocation: 'Depósito DEMO — Santa Cruz (post importación Arica)',
      isDemo: true,
    },
  });

  await seedHighRiskAudit(batch3.id, {
    declared: 100000,
    received: 99900,
    stored: 98700,
    sensor: 98650, // SIMULATOR (ESP32 deferred)
    vehicleId: vehicle.id,
    tankId: tank.id,
    actors: {
      importer: importer.id,
      transporter: transporter.id,
      depot: depot.id,
      lab: labUser.id,
      auditor: auditor.id,
    },
  });

  await seedCbbaCustodyDeliveries(
    boliviaStations,
    [
      { id: batch2.id, batchCode: batch2.batchCode },
      { id: batch3.id, batchCode: batch3.batchCode },
      { id: batch1.id, batchCode: batch1.batchCode },
    ],
    transporter.id,
  );

  console.log('[DEMO] Seed complete:');
  console.log('  - FC-BO-2026-000181  LOW / COMPLETED');
  console.log('  - FC-BO-2026-000182  MEDIUM / IN_TRANSIT');
  console.log('  - FC-BO-2026-000184  HIGH / AUDIT_REQUIRED (discrepancy narrative)');
  console.log(
    `  - ${boliviaStations.length} estaciones en ${deptCount} departamentos + entregas QR DEMO`,
  );
  console.log('  - Login DEMO password: demo123 (chofer@ / estacion@ / ciudadano@ / anh@ …)');
  console.log('  Tank: TANK-001 | Measurement source: SIMULATOR (ESP32 deferred)');
}

/** Despachos DEMO ricos: Cala Cala con historial + en ruta; red con calidad mixta. */
async function seedCbbaCustodyDeliveries(
  stations: Array<{ id: string; code: string }>,
  batches: Array<{ id: string; batchCode: string }>,
  driverId: string,
) {
  const byCode = Object.fromEntries(stations.map((s) => [s.code, s]));
  const diesel = batches.find((b) => b.batchCode.includes('182')) ?? batches[0];
  const gasAudit =
    batches.find((b) => b.batchCode.includes('184')) ?? batches[1] ?? batches[0];
  const gasDone =
    batches.find((b) => b.batchCode.includes('181')) ?? batches[2] ?? batches[0];

  const mkCistern = async (
    code: string,
    plate: string,
    opts: {
      driverId?: string;
      load?: number;
      status?: CisternStatus;
      batchId?: string;
    } = {},
  ) =>
    prisma.cistern.create({
      data: {
        code,
        qrToken: `CQ-${code.replace(/^CIS-/, '')}`,
        deviceId: `GW-${code}`,
        plate,
        carrier: 'Transportes DEMO SRL',
        capacityLiters: 30000,
        currentLoadLiters: opts.load ?? 0,
        status: opts.status ?? CisternStatus.AVAILABLE,
        driverId: opts.driverId ?? null,
        currentBatchId: opts.batchId ?? null,
        isDemo: true,
      },
    });

  const cis01 = await mkCistern('CIS-CBB-01', 'CBB-101', {
    driverId,
    load: 8000,
    status: CisternStatus.IN_TRANSIT,
    batchId: diesel.id,
  });
  const cis02 = await mkCistern('CIS-CBB-02', 'CBB-102', {
    load: 7500,
    status: CisternStatus.IN_TRANSIT,
    batchId: gasAudit.id,
  });
  const cis03 = await mkCistern('CIS-CBB-03', 'CBB-103');
  const cis04 = await mkCistern('CIS-CBB-04', 'CBB-104');

  // Stickers QR DEMO: CIS-CBB-05 … CIS-CBB-50 (50 en total con 01–04)
  const extraFleet: Awaited<ReturnType<typeof mkCistern>>[] = [];
  for (let i = 5; i <= 50; i++) {
    const num = String(i).padStart(2, '0');
    const inTransit = i % 3 === 0;
    extraFleet.push(
      await mkCistern(`CIS-CBB-${num}`, `CBB-${100 + i}`, {
        load: inTransit ? 5000 + (i % 7) * 250 : 0,
        status: inTransit ? CisternStatus.IN_TRANSIT : CisternStatus.AVAILABLE,
        batchId: inTransit ? (i % 2 === 0 ? diesel.id : gasAudit.id) : undefined,
        driverId: inTransit && i % 5 === 0 ? driverId : undefined,
      }),
    );
  }
  const fleet = [cis01, cis02, cis03, cis04, ...extraFleet];
  console.log(`[DEMO] Flota cisternas con QR sticker: ${fleet.length}`);

  type Trip = {
    stationCode: string;
    batch: { id: string; batchCode: string };
    cistern: { id: string; code: string };
    volume: number;
    received?: number;
    status: DeliveryStatus;
    water?: boolean;
    density?: number;
    hoursLoaded: number;
    hoursDelivered?: number;
    activeBaton?: boolean;
  };

  const trips: Trip[] = [
    // Cala Cala — ejemplos para estacion@
    {
      stationCode: 'ST-CBB-01',
      batch: diesel,
      cistern: cis03,
      volume: 8500,
      received: 8480,
      status: DeliveryStatus.DELIVERED,
      hoursLoaded: 46,
      hoursDelivered: 44,
    },
    {
      stationCode: 'ST-CBB-01',
      batch: gasDone,
      cistern: cis04,
      volume: 7200,
      received: 7185,
      status: DeliveryStatus.DELIVERED,
      hoursLoaded: 20,
      hoursDelivered: 18,
    },
    {
      stationCode: 'ST-CBB-01',
      batch: diesel,
      cistern: cis01,
      volume: 8000,
      status: DeliveryStatus.IN_TRANSIT,
      hoursLoaded: 3,
      activeBaton: true,
    },
    // Red — para mapa / ANH
    {
      stationCode: 'ST-CBB-02',
      batch: diesel,
      cistern: cis03,
      volume: 8000,
      received: 7970,
      status: DeliveryStatus.DELIVERED,
      hoursLoaded: 40,
      hoursDelivered: 38,
    },
    {
      stationCode: 'ST-CBB-03',
      batch: gasAudit,
      cistern: cis04,
      volume: 6500,
      received: 6480,
      status: DeliveryStatus.DELIVERED,
      hoursLoaded: 36,
      hoursDelivered: 34,
    },
    {
      stationCode: 'ST-CBB-05',
      batch: diesel,
      cistern: cis03,
      volume: 5000,
      received: 4990,
      status: DeliveryStatus.DELIVERED,
      hoursLoaded: 52,
      hoursDelivered: 50,
    },
    {
      stationCode: 'ST-CBB-06',
      batch: gasDone,
      cistern: cis04,
      volume: 9000,
      received: 8990,
      status: DeliveryStatus.DELIVERED,
      hoursLoaded: 28,
      hoursDelivered: 26,
    },
    {
      stationCode: 'ST-CBB-08',
      batch: gasAudit,
      cistern: cis03,
      volume: 6000,
      received: 5950,
      status: DeliveryStatus.DELIVERED,
      water: true,
      density: 0.81,
      hoursLoaded: 24,
      hoursDelivered: 22,
    },
    {
      stationCode: 'ST-CBB-04',
      batch: diesel,
      cistern: cis02,
      volume: 7500,
      status: DeliveryStatus.IN_TRANSIT,
      hoursLoaded: 5,
      activeBaton: true,
    },
  ];

  const deliveredByBatch = new Map<string, number>();
  let n = 0;
  for (const trip of trips) {
    const station = byCode[trip.stationCode];
    if (!station) continue;
    n += 1;
    const tokenId = `BT-DEMO-${trip.stationCode}-${n}`;
    const water = Boolean(trip.water);
    const density = trip.density ?? (water ? 0.81 : 0.746);
    const payload = {
      batch: trip.batch.batchCode,
      station: trip.stationCode,
      cistern: trip.cistern.code,
      vol: trip.volume,
      label: 'DEMO',
    };

    const delivered = trip.status === DeliveryStatus.DELIVERED;
    const delivery = await prisma.delivery.create({
      data: {
        batchId: trip.batch.id,
        cisternId: trip.cistern.id,
        destinationStationId: station.id,
        status: trip.status,
        loadedLiters: trip.volume,
        receivedLiters: delivered ? (trip.received ?? trip.volume - 20) : null,
        loadDensity: density,
        loadTemperature: 22.1,
        loadWaterDetected: water,
        loadCertificateStatus: water ? 'ALERTA DEMO' : 'OK DEMO',
        receivedDensity: delivered ? density : null,
        receivedTemperature: delivered ? 22.4 : null,
        receivedWaterDetected: delivered ? water : false,
        loadedAt: hoursAgo(trip.hoursLoaded),
        deliveredAt:
          delivered && trip.hoursDelivered != null
            ? hoursAgo(trip.hoursDelivered)
            : null,
        batonTokenId: tokenId,
        isDemo: true,
      },
    });

    await prisma.custodyBaton.create({
      data: {
        tokenId,
        batchId: trip.batch.id,
        stationId: station.id,
        cisternId: trip.cistern.id,
        deliveryId: delivery.id,
        cisternCode: trip.cistern.code,
        eventType: delivered ? 'RECEIVED' : 'IN_TRANSIT',
        volumeLiters: trip.volume,
        payloadJson: payload,
        payloadHash: demoHash(JSON.stringify(payload)),
        signature: demoHash(`sig:${tokenId}`),
        status: delivered ? BatonStatus.CONSUMED : BatonStatus.ACTIVE,
        issuedByRole: 'TRANSPORTER',
        consumedByRole: delivered ? 'STATION_STAFF' : null,
        issuedAt: hoursAgo(trip.hoursLoaded),
        consumedAt:
          delivered && trip.hoursDelivered != null
            ? hoursAgo(trip.hoursDelivered)
            : null,
        expiresAt: delivered ? null : hoursAgo(-48),
        isDemo: true,
      },
    });

    await prisma.custodyEvent.create({
      data: {
        batchId: trip.batch.id,
        eventType: delivered
          ? CustodyEventType.RECEIVED
          : CustodyEventType.IN_TRANSIT,
        location: delivered
          ? `Estación ${trip.stationCode} (Cochabamba) DEMO`
          : `Cisterna ${trip.cistern.code} → ${trip.stationCode} DEMO`,
        declaredVolume: trip.volume,
        measuredVolume: delivered
          ? (trip.received ?? trip.volume - 20)
          : trip.volume,
        actorId: driverId,
        timestamp: hoursAgo(
          delivered ? (trip.hoursDelivered ?? trip.hoursLoaded) : trip.hoursLoaded,
        ),
        metadata: {
          label: 'DEMO',
          cisternCode: trip.cistern.code,
          stationCode: trip.stationCode,
          deliveryId: delivery.id,
          batonTokenId: tokenId,
        },
        isDemo: true,
      },
    });

    if (delivered) {
      const recv = trip.received ?? trip.volume - 20;
      deliveredByBatch.set(
        trip.batch.id,
        (deliveredByBatch.get(trip.batch.id) ?? 0) + recv,
      );
    }
  }

  for (const [batchId, liters] of deliveredByBatch) {
    await prisma.fuelBatch.update({
      where: { id: batchId },
      data: { deliveredLiters: liters },
    });
  }

  console.log(
    `[DEMO] Entregas CBBA: ${trips.length} (Cala Cala: 2 recibidas + 1 en ruta · flota ${fleet.length} cisternas)`,
  );

  // Checkpoints GPS DEMO para despachos en tránsito
  const inTransit = await prisma.delivery.findMany({
    where: { status: DeliveryStatus.IN_TRANSIT },
    include: { cistern: true, station: true, batch: true },
  });
  for (const d of inTransit) {
    const baseLat = Number(d.station.latitude);
    const baseLng = Number(d.station.longitude);
    await prisma.routeCheckpoint.create({
      data: {
        kind: 'LOAD_DEPARTURE',
        label: 'Salida depósito DEMO Santa Cruz',
        deliveryId: d.id,
        cisternId: d.cisternId,
        batchId: d.batchId,
        actorId: driverId,
        volumeLiters: d.loadedLiters,
        density: d.loadDensity,
        temperature: d.loadTemperature,
        waterDetected: d.loadWaterDetected,
        latitude: -17.7833,
        longitude: -63.1821,
        accuracyMeters: 25,
        capturedAt: hoursAgo(8),
        clientEventId: `seed-dep-${d.id}`,
        note: 'Checkpoint DEMO',
        isDemo: true,
      },
    });
    await prisma.routeCheckpoint.create({
      data: {
        kind: 'ROUTE_WAYPOINT',
        label: 'Control ruta DEMO · aproximación CBBA',
        deliveryId: d.id,
        cisternId: d.cisternId,
        batchId: d.batchId,
        actorId: driverId,
        volumeLiters: Number(d.loadedLiters.toString()) - 1,
        density: Number(Number(d.loadDensity?.toString() ?? 0.746).toFixed(4)),
        temperature: 22.5,
        waterDetected: false,
        latitude: -17.7833 + (baseLat + 17.7833) * 0.4,
        longitude: -63.1821 + (baseLng + 63.1821) * 0.4,
        accuracyMeters: 40,
        capturedAt: hoursAgo(5),
        clientEventId: `seed-wp1-${d.id}`,
        note: 'Control ruta — logger cisterna',
        isDemo: true,
      },
    });
    const dens0 = Number(d.loadDensity?.toString() ?? 0.746);
    await prisma.routeCheckpoint.create({
      data: {
        kind: 'ROUTE_WAYPOINT',
        label: 'Aproximación estación DEMO',
        deliveryId: d.id,
        cisternId: d.cisternId,
        batchId: d.batchId,
        actorId: driverId,
        volumeLiters: Number(d.loadedLiters.toString()) - 3,
        density: Number((dens0 - 0.002).toFixed(4)),
        temperature: 23.6,
        waterDetected: dens0 > 0.8,
        latitude: baseLat + 0.02,
        longitude: baseLng + 0.01,
        accuracyMeters: 35,
        capturedAt: hoursAgo(2),
        clientEventId: `seed-wp2-${d.id}`,
        note: 'Bajó ~2 L + cambio calidad (dens/temp)',
        isDemo: true,
      },
    });
  }
  console.log(
    `[DEMO] Checkpoints GPS: ${inTransit.length * 3} tramos para despachos en ruta`,
  );

  // Viajes DEMO para el resto de la flota (stickers 05–50 en tránsito)
  const stationHome = byCode['ST-CBB-01'];
  if (stationHome) {
    let extraTrips = 0;
    for (const c of fleet) {
      if (c.code === 'CIS-CBB-01' || c.code === 'CIS-CBB-02') continue;
      if (c.status !== CisternStatus.IN_TRANSIT || !c.currentBatchId) continue;
      const existing = await prisma.delivery.findFirst({
        where: { cisternId: c.id, status: DeliveryStatus.IN_TRANSIT },
      });
      if (existing) continue;
      const vol = Number(c.currentLoadLiters.toString()) || 6000;
      const dens = 0.745 + (extraTrips % 5) * 0.001;
      const delivery = await prisma.delivery.create({
        data: {
          batchId: c.currentBatchId,
          cisternId: c.id,
          destinationStationId: stationHome.id,
          status: DeliveryStatus.IN_TRANSIT,
          loadedLiters: vol,
          loadDensity: dens,
          loadTemperature: 21.5,
          loadWaterDetected: false,
          loadedAt: hoursAgo(6 + (extraTrips % 4)),
          isDemo: true,
        },
      });
      const t0 = hoursAgo(6 + (extraTrips % 4));
      await prisma.routeCheckpoint.createMany({
        data: [
          {
            kind: 'LOAD_DEPARTURE',
            label: `Carga ${c.code}`,
            deliveryId: delivery.id,
            cisternId: c.id,
            batchId: c.currentBatchId,
            actorId: driverId,
            volumeLiters: vol,
            density: dens,
            temperature: 21.5,
            waterDetected: false,
            latitude: -17.7833,
            longitude: -63.1821,
            capturedAt: t0,
            clientEventId: `fleet-load-${c.id}`,
            note: 'Logger cisterna DEMO',
            isDemo: true,
          },
          {
            kind: 'ROUTE_WAYPOINT',
            label: 'Control ruta',
            deliveryId: delivery.id,
            cisternId: c.id,
            batchId: c.currentBatchId,
            actorId: driverId,
            volumeLiters: vol - 1,
            density: dens,
            temperature: 22.1,
            waterDetected: false,
            latitude: -17.55,
            longitude: -64.8,
            capturedAt: new Date(t0.getTime() + 2 * 3600_000),
            clientEventId: `fleet-wp1-${c.id}`,
            note: 'Muestra en ruta',
            isDemo: true,
          },
          {
            kind: 'ROUTE_WAYPOINT',
            label: 'Aproximación CBBA',
            deliveryId: delivery.id,
            cisternId: c.id,
            batchId: c.currentBatchId,
            actorId: driverId,
            volumeLiters: vol - 3,
            density: Number((dens - 0.002).toFixed(4)),
            temperature: 23.4,
            waterDetected: extraTrips % 7 === 0,
            latitude: -17.4,
            longitude: -66.1,
            capturedAt: new Date(t0.getTime() + 5 * 3600_000),
            clientEventId: `fleet-wp2-${c.id}`,
            note: 'Δ cantidad ~-2 L + Δ calidad',
            isDemo: true,
          },
        ],
      });
      extraTrips += 1;
    }
    console.log(`[DEMO] Viajes extra flota QR: ${extraTrips}`);
  }
}

async function seedHappyPath(
  batchId: string,
  opts: {
    declared: number;
    border: number;
    depot: number;
    sensor: number;
    vehicleId: string;
    tankId: string;
    actors: { importer: string; transporter: string; depot: string; lab: string };
    destination: string;
    completed: boolean;
  },
) {
  const docs = await createCoreDocs(batchId, 'B1');

  await prisma.importAuthorization.create({
    data: {
      batchId,
      authorizationType: 'IMPORT_CARBURANTES_DEMO',
      referenceNumber: 'AUTH-DEMO-000181',
      issuer: 'ANH (referencia DEMO — no API oficial)',
      status: AuthorizationStatus.APPROVED,
      issuedAt: hoursAgo(120),
      expiresAt: hoursAgo(-720),
      documentId: docs.customs?.id,
      isDemo: true,
    },
  });

  await prisma.transport.create({
    data: {
      batchId,
      vehicleId: opts.vehicleId,
      transportType: TransportType.TRUCK,
      carrier: 'Transportes DEMO SRL',
      vehicleRef: 'DEMO-1234',
      origin: 'Argentina',
      destination: opts.destination,
      departureAt: hoursAgo(96),
      arrivalAt: hoursAgo(48),
      status: TransportStatus.ARRIVED,
      isDemo: true,
    },
  });

  const custody: Array<{
    eventType: CustodyEventType;
    hours: number;
    actorId?: string;
    location: string;
    declared?: number;
    measured?: number;
  }> = [
    { eventType: 'CREATED', hours: 120, actorId: opts.actors.importer, location: 'Argentina', declared: opts.declared },
    { eventType: 'LOADED', hours: 100, actorId: opts.actors.transporter, location: 'Planta carga DEMO', declared: opts.declared },
    { eventType: 'INSPECTED', hours: 98, location: 'Inspección origen DEMO', declared: opts.declared },
    { eventType: 'IN_TRANSIT', hours: 90, actorId: opts.actors.transporter, location: 'Ruta DEMO', declared: opts.declared },
    { eventType: 'ENTERED_COUNTRY', hours: 72, location: 'Frontera DEMO', declared: opts.declared, measured: opts.border },
    { eventType: 'CUSTOMS', hours: 70, location: 'Aduana DEMO', declared: opts.declared, measured: opts.border },
    { eventType: 'RECEIVED', hours: 60, actorId: opts.actors.depot, location: 'Depósito DEMO', declared: opts.declared, measured: opts.depot },
    { eventType: 'SAMPLED', hours: 58, actorId: opts.actors.lab, location: 'Muestreo DEMO' },
    { eventType: 'LAB_ANALYSIS', hours: 50, actorId: opts.actors.lab, location: 'Lab DEMO' },
    { eventType: 'CERTIFIED', hours: 48, actorId: opts.actors.lab, location: 'Lab DEMO' },
    { eventType: 'STORED', hours: 40, actorId: opts.actors.depot, location: 'Tanque DEMO', measured: opts.depot },
    { eventType: 'DISPATCHED', hours: 24, location: 'Despacho DEMO', measured: opts.depot },
    { eventType: 'DELIVERED', hours: 12, location: opts.destination, measured: opts.sensor },
  ];

  for (const e of custody) {
    await prisma.custodyEvent.create({
      data: {
        batchId,
        eventType: e.eventType,
        actorId: e.actorId,
        location: e.location,
        declaredVolume: e.declared,
        measuredVolume: e.measured,
        timestamp: hoursAgo(e.hours),
        evidenceHash: demoHash(`${batchId}:${e.eventType}`),
        metadata: { label: 'DEMO' },
        isDemo: true,
      },
    });
  }

  await prisma.customsEvent.create({
    data: {
      batchId,
      eventType: 'BORDER_ENTRY_DEMO',
      location: 'Frontera DEMO',
      declaredVolume: opts.declared,
      measuredVolume: opts.border,
      timestamp: hoursAgo(70),
      isDemo: true,
    },
  });

  const sample = await prisma.samplingEvent.create({
    data: {
      batchId,
      location: 'Depósito DEMO',
      sampleCode: 'SMP-DEMO-000181',
      takenBy: 'LAB DEMO',
      timestamp: hoursAgo(58),
      metadata: { label: 'DEMO' },
      isDemo: true,
    },
  });

  await prisma.labAnalysis.create({
    data: {
      batchId,
      sampleId: sample.id,
      laboratory: 'Lab DEMO (no certificado industrial)',
      analysisDate: hoursAgo(50),
      parameters: [
        { parameter: 'example_density', value: 0.74, unit: 'g/ml', reference: 'demo' },
        { parameter: 'example_octane', value: 91, unit: 'RON', reference: 'demo' },
      ],
      result: 'PASS',
      status: LabResultStatus.DEMO,
      isDemo: true,
    },
  });

  await prisma.qualityCertificate.create({
    data: {
      batchId,
      certificateType: 'QUALITY_CERTIFICATE',
      issuer: 'Issuer DEMO',
      certificateNumber: 'QC-DEMO-000181',
      issueDate: hoursAgo(48),
      status: CertificateStatus.DEMO,
      documentId: docs.quality.id,
      hash: demoHash('QC-DEMO-000181'),
      isDemo: true,
    },
  });

  await prisma.measurement.create({
    data: {
      batchId,
      tankId: opts.tankId,
      deviceId: 'SIM-TANK-001',
      volumeLiters: opts.sensor,
      temperature: 23.1,
      timestamp: hoursAgo(36),
      source: MeasurementSource.SIMULATOR,
      isDemo: true,
    },
  });

  await prisma.blockchainAnchor.create({
    data: {
      batchId,
      eventKind: 'BatchCreated',
      eventId: batchId,
      dataHash: `0x${demoHash(`anchor:${batchId}`).slice(0, 64)}`,
      transactionHash: `0xDEMO${demoHash(batchId).slice(0, 56)}`,
      blockNumber: BigInt(1001),
      chainId: 31337,
      actorWallet: '0xDEMOimporter0000000000000000000000001',
      timestamp: hoursAgo(119),
      isDemo: true,
    },
  });
}

async function seedInTransit(
  batchId: string,
  opts: {
    declared: number;
    vehicleId: string;
    actors: { importer: string; transporter: string };
  },
) {
  await createCoreDocs(batchId, 'B2');

  await prisma.importAuthorization.create({
    data: {
      batchId,
      authorizationType: 'IMPORT_CARBURANTES_DEMO',
      referenceNumber: 'AUTH-DEMO-000182',
      issuer: 'ANH (referencia DEMO)',
      status: AuthorizationStatus.APPROVED,
      issuedAt: hoursAgo(48),
      isDemo: true,
    },
  });

  await prisma.transport.create({
    data: {
      batchId,
      vehicleId: opts.vehicleId,
      transportType: TransportType.TRUCK,
      carrier: 'Transportes DEMO SRL',
      origin: 'Terminal Terrestre Arica / Sica Sica',
      destination: 'Cochabamba, Bolivia',
      departureAt: hoursAgo(24),
      status: TransportStatus.IN_TRANSIT,
      isDemo: true,
    },
  });

  for (const e of [
    {
      eventType: 'CREATED' as const,
      hours: 72,
      actorId: opts.actors.importer,
      location: 'Programación importación DEMO (buque → Arica)',
    },
    {
      eventType: 'LOADED' as const,
      hours: 48,
      actorId: opts.actors.transporter,
      location: 'Descarga buque Terminal Marítima Sica Sica',
    },
    {
      eventType: 'INSPECTED' as const,
      hours: 40,
      location: 'Terminal Terrestre Arica — tanques',
    },
    {
      eventType: 'IN_TRANSIT' as const,
      hours: 24,
      actorId: opts.actors.transporter,
      location: 'Cisterna DEMO en ruta Arica → Bolivia → CBBA',
    },
  ]) {
    await prisma.custodyEvent.create({
      data: {
        batchId,
        eventType: e.eventType,
        actorId: e.actorId,
        location: e.location,
        declaredVolume: opts.declared,
        timestamp: hoursAgo(e.hours),
        evidenceHash: demoHash(`${batchId}:${e.eventType}`),
        metadata: {
          label: 'DEMO',
          corridor: 'ARICA_SICA_SICA',
          note: 'Abstracción FuelChain sobre hub reportado YPFB en Arica',
        },
        isDemo: true,
      },
    });
  }
}

async function seedHighRiskAudit(
  batchId: string,
  opts: {
    declared: number;
    received: number;
    stored: number;
    sensor: number;
    vehicleId: string;
    tankId: string;
    actors: {
      importer: string;
      transporter: string;
      depot: string;
      lab: string;
      auditor: string;
    };
  },
) {
  const docs = await createCoreDocs(batchId, 'B3');

  await prisma.importAuthorization.create({
    data: {
      batchId,
      authorizationType: 'IMPORT_CARBURANTES_DEMO',
      referenceNumber: 'AUTH-DEMO-000184',
      issuer: 'ANH (referencia DEMO — no API oficial)',
      status: AuthorizationStatus.APPROVED,
      issuedAt: hoursAgo(200),
      expiresAt: hoursAgo(-500),
      isDemo: true,
    },
  });

  await prisma.transport.create({
    data: {
      batchId,
      vehicleId: opts.vehicleId,
      transportType: TransportType.TRUCK,
      carrier: 'Transportes DEMO SRL',
      vehicleRef: 'DEMO-1234',
      origin: 'Terminal Terrestre Arica / Sica Sica',
      destination: 'Santa Cruz, Bolivia',
      departureAt: hoursAgo(160),
      arrivalAt: hoursAgo(100),
      status: TransportStatus.ARRIVED,
      isDemo: true,
    },
  });

  const steps: Array<{
    eventType: CustodyEventType;
    hours: number;
    actorId?: string;
    location: string;
    declared?: number;
    measured?: number;
  }> = [
    {
      eventType: 'CREATED',
      hours: 200,
      actorId: opts.actors.importer,
      location: 'Programación buque → Sica Sica Arica',
      declared: opts.declared,
    },
    {
      eventType: 'LOADED',
      hours: 180,
      actorId: opts.actors.transporter,
      location: 'Descarga marítima Sica Sica',
      declared: opts.declared,
    },
    {
      eventType: 'INSPECTED',
      hours: 178,
      location: 'Terminal Terrestre Arica',
      declared: opts.declared,
    },
    {
      eventType: 'IN_TRANSIT',
      hours: 160,
      actorId: opts.actors.transporter,
      location: 'Cisternas Arica → Bolivia',
      declared: opts.declared,
    },
    {
      eventType: 'ENTERED_COUNTRY',
      hours: 120,
      location: 'Ingreso frontera DEMO (corredor Chile–Bolivia)',
      declared: opts.declared,
      measured: opts.received,
    },
    {
      eventType: 'CUSTOMS',
      hours: 118,
      location: 'Aduana / documentación DIM DEMO',
      declared: opts.declared,
      measured: opts.received,
    },
    {
      eventType: 'RECEIVED',
      hours: 100,
      actorId: opts.actors.depot,
      location: 'Recepción depósito DEMO Santa Cruz',
      declared: opts.declared,
      measured: opts.received,
    },
    { eventType: 'SAMPLED', hours: 90, actorId: opts.actors.lab, location: 'Muestreo DEMO' },
    { eventType: 'LAB_ANALYSIS', hours: 80, actorId: opts.actors.lab, location: 'Lab DEMO' },
    { eventType: 'CERTIFIED', hours: 70, actorId: opts.actors.lab, location: 'Lab DEMO' },
    {
      eventType: 'STORED',
      hours: 60,
      actorId: opts.actors.depot,
      location: 'TANK-001 DEMO',
      measured: opts.stored,
    },
  ];

  for (const e of steps) {
    await prisma.custodyEvent.create({
      data: {
        batchId,
        eventType: e.eventType,
        actorId: e.actorId,
        location: e.location,
        declaredVolume: e.declared,
        measuredVolume: e.measured,
        timestamp: hoursAgo(e.hours),
        evidenceHash: demoHash(`${batchId}:${e.eventType}`),
        metadata: { label: 'DEMO' },
        isDemo: true,
      },
    });
  }

  await prisma.customsEvent.create({
    data: {
      batchId,
      eventType: 'BORDER_ENTRY_DEMO',
      location: 'Frontera DEMO Yacuiba',
      declaredVolume: opts.declared,
      measuredVolume: opts.received,
      timestamp: hoursAgo(118),
      isDemo: true,
    },
  });

  const sample = await prisma.samplingEvent.create({
    data: {
      batchId,
      location: 'Depósito DEMO Santa Cruz',
      sampleCode: 'SMP-DEMO-000184',
      takenBy: 'LAB DEMO',
      timestamp: hoursAgo(90),
      metadata: { label: 'DEMO' },
      isDemo: true,
    },
  });

  await prisma.labAnalysis.create({
    data: {
      batchId,
      sampleId: sample.id,
      laboratory: 'Lab DEMO',
      analysisDate: hoursAgo(80),
      parameters: [
        { parameter: 'example_density', value: 0.739, unit: 'g/ml', reference: 'demo' },
        { parameter: 'example_sulfur', value: 10, unit: 'ppm', reference: 'demo' },
      ],
      result: 'PASS — parameters are not regulatory claims',
      status: LabResultStatus.DEMO,
      isDemo: true,
    },
  });

  await prisma.qualityCertificate.create({
    data: {
      batchId,
      certificateType: 'QUALITY_CERTIFICATE',
      issuer: 'Issuer DEMO',
      certificateNumber: 'QC-DEMO-000184',
      issueDate: hoursAgo(70),
      status: CertificateStatus.DEMO,
      documentId: docs.quality.id,
      hash: demoHash('QC-DEMO-000184'),
      isDemo: true,
    },
  });

  // Volume narrative: Declared → Received → Stored → SIMULATOR
  await prisma.measurement.create({
    data: {
      batchId,
      tankId: opts.tankId,
      deviceId: 'SIM-TANK-001',
      volumeLiters: opts.sensor,
      temperature: 24.3,
      latitude: -17.7833, // DEMO coords — not official
      longitude: -63.1821,
      timestamp: hoursAgo(48),
      source: MeasurementSource.SIMULATOR,
      isDemo: true,
    },
  });

  const anomaly = await prisma.anomaly.create({
    data: {
      batchId,
      type: AnomalyType.VOLUME_DISCREPANCY,
      severity: AnomalySeverity.HIGH,
      expected: `${opts.declared} L declared`,
      actual: `${opts.sensor} L simulator measurement`,
      difference: `${opts.declared - opts.sensor} L total (Declared->Sensor)`,
      riskImpact: 28,
      status: AnomalyStatus.OPEN,
      explanation:
        'ANOMALY / DISCREPANCY. Possible causes include measurement error, calibration, temperature, operational differences, incorrect documentation, physical loss, or other factors. Not an automatic finding of theft or corruption.',
      isDemo: true,
    },
  });

  const audit = await prisma.auditCase.create({
    data: {
      batchId,
      anomalyId: anomaly.id,
      title: 'Audit Case DEMO — FC-BO-2026-000184 volume discrepancy',
      riskScore: 82,
      status: AuditCaseStatus.OPEN,
      assigneeId: opts.actors.auditor,
      aiExplanation:
        '¿Por qué este lote tiene riesgo alto? (Mock AI / DEMO)\n\nEl lote FC-BO-2026-000184 presenta diferencias de volumen entre declaración (100,000 L), recepción (99,900 L), almacenamiento (98,700 L) y medición de tanque SIMULATOR (98,650 L). También hay señales temporales en la cadena de custodia. Se recomienda revisar documentos de transporte, mediciones y registros de recepción. La IA no declara fraude.',
      blockchainTxHash: `0xDEMO${demoHash('anomaly-184').slice(0, 56)}`,
      isDemo: true,
    },
  });

  await prisma.auditNote.create({
    data: {
      auditCaseId: audit.id,
      authorId: opts.actors.auditor,
      body: 'Caso abierto. Pendiente revisión de evidencias. No se atribuye culpabilidad automática.',
      isDemo: true,
    },
  });

  await prisma.blockchainAnchor.createMany({
    data: [
      {
        batchId,
        eventKind: 'BatchCreated',
        eventId: batchId,
        dataHash: `0x${demoHash(`anchor-create:${batchId}`).slice(0, 64)}`,
        transactionHash: `0xDEMO${demoHash(`tx-create-${batchId}`).slice(0, 56)}`,
        blockNumber: BigInt(2001),
        chainId: 31337,
        isDemo: true,
        timestamp: hoursAgo(199),
      },
      {
        batchId,
        eventKind: 'AnomalyRegistered',
        eventId: anomaly.id,
        dataHash: `0x${demoHash(`anchor-anomaly:${anomaly.id}`).slice(0, 64)}`,
        transactionHash: `0xDEMO${demoHash('anomaly-184').slice(0, 56)}`,
        blockNumber: BigInt(2042),
        chainId: 31337,
        isDemo: true,
        timestamp: hoursAgo(40),
      },
      {
        batchId,
        eventKind: 'DocumentHashRegistered',
        eventId: docs.origin.id,
        dataHash: `0x${docs.origin.sha256Hash}`,
        transactionHash: `0xDEMO${demoHash('doc-origin-184').slice(0, 56)}`,
        blockNumber: BigInt(2005),
        chainId: 31337,
        isDemo: true,
        timestamp: hoursAgo(190),
      },
    ],
  });
}

async function createCoreDocs(batchId: string, tag: string) {
  const origin = await prisma.document.create({
    data: {
      batchId,
      name: `Certificate of Origin DEMO ${tag}`,
      type: DocumentType.CERTIFICATE_OF_ORIGIN,
      storageUrl: `file://demo/docs/${tag}-origin.pdf`,
      sha256Hash: demoHash(`${tag}-origin`),
      blockchainTxHash: `0xDEMO${demoHash(`${tag}-origin-tx`).slice(0, 56)}`,
      isDemo: true,
    },
  });

  const quality = await prisma.document.create({
    data: {
      batchId,
      name: `Quality Certificate DEMO ${tag}`,
      type: DocumentType.QUALITY_CERTIFICATE,
      storageUrl: `file://demo/docs/${tag}-quality.pdf`,
      sha256Hash: demoHash(`${tag}-quality`),
      blockchainTxHash: `0xDEMO${demoHash(`${tag}-quality-tx`).slice(0, 56)}`,
      isDemo: true,
    },
  });

  const transport = await prisma.document.create({
    data: {
      batchId,
      name: `Transport Document DEMO ${tag}`,
      type: DocumentType.TRANSPORT_DOCUMENT,
      storageUrl: `file://demo/docs/${tag}-transport.pdf`,
      sha256Hash: demoHash(`${tag}-transport`),
      isDemo: true,
    },
  });

  const customs = await prisma.document.create({
    data: {
      batchId,
      name: `Customs Document DEMO ${tag}`,
      type: DocumentType.CUSTOMS_DOCUMENT,
      storageUrl: `file://demo/docs/${tag}-customs.pdf`,
      sha256Hash: demoHash(`${tag}-customs`),
      isDemo: true,
    },
  });

  return { origin, quality, transport, customs };
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('[DEMO] Seed failed', e);
    await prisma.$disconnect();
    process.exit(1);
  });
