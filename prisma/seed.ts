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
 * Estaciones DEMO del valle de Cochabamba.
 * Nombres/direcciones inspirados en listados públicos ANH (registro histórico);
 * coordenadas aproximadas; inventario 100% DEMO — no es feed oficial ANH Abastecimiento.
 */
async function seedCochabambaStations() {
  const defs = [
    {
      code: 'ST-CBB-01',
      name: 'EESS Cala Cala (DEMO)',
      municipality: 'Cercado',
      address: 'Av. América — zona Cala Cala (DEMO)',
      latitude: -17.3742,
      longitude: -66.1475,
      availability: StationAvailability.FULL,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tankName: 'TANK-CALA-01',
      capacity: 45000,
      fillLiters: 18000,
      waterDetected: false,
      temp: 21.2,
    },
    {
      code: 'ST-CBB-02',
      name: 'Surtidor Virgen de Guadalupe (DEMO)',
      municipality: 'Quillacollo',
      address: 'Av. Albina Patiño — Quillacollo (DEMO)',
      latitude: -17.3978,
      longitude: -66.2789,
      availability: StationAvailability.MEDIUM,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tankName: 'TANK-QLLO-VG',
      capacity: 40000,
      fillLiters: 17500,
      waterDetected: false,
      temp: 22.0,
    },
    {
      code: 'ST-CBB-03',
      name: 'Trans Sacaba (DEMO)',
      municipality: 'Sacaba',
      address: 'Calle Ayacucho — Sacaba (DEMO)',
      latitude: -17.4041,
      longitude: -66.0418,
      availability: StationAvailability.LOW,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tankName: 'TANK-SAC-01',
      capacity: 38000,
      fillLiters: 5100,
      waterDetected: false,
      temp: 23.1,
    },
    {
      code: 'ST-CBB-04',
      name: 'Señor de Santiago / Mayorazgo (DEMO)',
      municipality: 'Cercado',
      address: 'Av. Melchor Pérez de Olguín (DEMO)',
      latitude: -17.3668,
      longitude: -66.1742,
      availability: StationAvailability.MEDIUM,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tankName: 'TANK-MAY-01',
      capacity: 35000,
      fillLiters: 16200,
      waterDetected: false,
      temp: 21.8,
    },
    {
      code: 'ST-CBB-05',
      name: 'El Viajero / Vinto (DEMO)',
      municipality: 'Vinto',
      address: 'Av. Albina Patiño esq. Rosas — Vinto (DEMO)',
      latitude: -17.3935,
      longitude: -66.3178,
      availability: StationAvailability.EMPTY,
      products: ['Diésel Oil'],
      tankName: 'TANK-VIN-01',
      capacity: 28000,
      fillLiters: 600,
      waterDetected: false,
      temp: 22.6,
    },
    {
      code: 'ST-CBB-06',
      name: 'Surtidor Nissan / Av. Petrolera (DEMO)',
      municipality: 'Cercado',
      address: 'Av. Petrolera Km 1 (DEMO)',
      latitude: -17.4285,
      longitude: -66.1648,
      availability: StationAvailability.FULL,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tankName: 'TANK-PET-01',
      capacity: 42000,
      fillLiters: 35100,
      waterDetected: false,
      temp: 24.0,
    },
    {
      code: 'ST-CBB-07',
      name: 'Pana Gas / Blanco Galindo (DEMO)',
      municipality: 'Quillacollo',
      address: 'Av. Blanco Galindo Km 12,5 (DEMO)',
      latitude: -17.3862,
      longitude: -66.2685,
      availability: StationAvailability.MEDIUM,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tankName: 'TANK-BG-01',
      capacity: 40000,
      fillLiters: 19800,
      waterDetected: false,
      temp: 22.3,
    },
    {
      code: 'ST-CBB-08',
      name: 'Gasolinera Rioja (DEMO)',
      municipality: 'Cercado',
      address: 'Av. Petrolera Km 4,5 (DEMO)',
      latitude: -17.4412,
      longitude: -66.1525,
      availability: StationAvailability.LOW,
      products: ['Gasolina Especial'],
      tankName: 'TANK-RIO-01',
      capacity: 30000,
      fillLiters: 3800,
      waterDetected: true,
      temp: 23.4,
    },
    {
      code: 'ST-CBB-09',
      name: 'Iquircollo (DEMO)',
      municipality: 'Quillacollo',
      address: 'Av. Blanco Galindo Km 11 1/2 (DEMO)',
      latitude: -17.3895,
      longitude: -66.2552,
      availability: StationAvailability.FULL,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tankName: 'TANK-IQ-01',
      capacity: 36000,
      fillLiters: 30100,
      waterDetected: false,
      temp: 21.9,
    },
    {
      code: 'ST-CBB-10',
      name: 'Estación Ayacucho Centro (DEMO)',
      municipality: 'Cercado',
      address: 'Av. Ayacucho zona central norte (DEMO)',
      latitude: -17.3858,
      longitude: -66.1562,
      availability: StationAvailability.UNKNOWN,
      products: ['Gasolina Especial', 'Diésel Oil'],
      tankName: 'TANK-AYA-01',
      capacity: 32000,
      fillLiters: null as number | null,
      waterDetected: false,
      temp: null as number | null,
    },
  ];

  const created = [];
  for (const d of defs) {
    const station = await prisma.station.create({
      data: {
        code: d.code,
        name: d.name,
        city: 'Cochabamba',
        municipality: d.municipality,
        address: d.address,
        latitude: d.latitude,
        longitude: d.longitude,
        publicVisible: true,
        availability:
          d.fillLiters == null
            ? StationAvailability.UNKNOWN
            : d.fillLiters / d.capacity >= 0.7
              ? StationAvailability.FULL
              : d.fillLiters / d.capacity >= 0.35
                ? StationAvailability.MEDIUM
                : d.fillLiters / d.capacity > 0.05
                  ? StationAvailability.LOW
                  : StationAvailability.EMPTY,
        products: d.products,
        lastInventoryAt: d.fillLiters != null ? hoursAgo(2) : null,
        isDemo: true,
      },
    });

    if (d.fillLiters != null && d.fillLiters > d.capacity) {
      throw new Error(
        `Seed inventory overflow ${d.code}: ${d.fillLiters} > ${d.capacity}`,
      );
    }

    const tank = await prisma.storageTank.create({
      data: {
        name: d.tankName,
        capacityLiters: d.capacity,
        currentStockLiters: d.fillLiters ?? 0,
        location: `${d.name} — Cochabamba (DEMO)`,
        stationId: station.id,
        status:
          d.availability === StationAvailability.EMPTY
            ? TankStatus.AVAILABLE
            : TankStatus.IN_USE,
        isDemo: true,
      },
    });

    if (d.fillLiters != null) {
      await prisma.measurement.create({
        data: {
          tankId: tank.id,
          deviceId: `SIM-CBBA-${d.code}`,
          volumeLiters: d.fillLiters,
          temperature: d.temp ?? undefined,
          waterDetected: d.waterDetected,
          density: 0.745 + Math.random() * 0.02,
          source: MeasurementSource.SIMULATOR,
          timestamp: hoursAgo(2),
          isDemo: true,
        },
      });
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
      name: 'Verificador ANH (read-only DEMO)',
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

  const cbbaStations = await seedCochabambaStations();
  console.log(
    `[DEMO] Cochabamba stations: ${cbbaStations.map((s) => s.code).join(', ')}`,
  );

  // Encargado EESS → solo Cala Cala (ST-CBB-01); no ve otras estaciones.
  const homeStation =
    cbbaStations.find((s) => s.code === 'ST-CBB-01') ?? cbbaStations[0];
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
    cbbaStations,
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
  console.log('  - 10 estaciones CBBA + cisternas + entregas QR DEMO');
  console.log('  - Login DEMO password: demo123 (chofer@ / estacion@ / ciudadano@ / anh@ …)');
  console.log('  Tank: TANK-001 | Measurement source: SIMULATOR (ESP32 deferred)');
}

/** Despachos reales: cisterna → estación, con calidad de viaje. */
async function seedCbbaCustodyDeliveries(
  stations: Array<{ id: string; code: string }>,
  batches: Array<{ id: string; batchCode: string }>,
  driverId: string,
) {
  const fleet = [];
  for (let n = 1; n <= 4; n += 1) {
    const code = `CIS-CBB-${String(n).padStart(2, '0')}`;
    const cistern = await prisma.cistern.create({
      data: {
        code,
        plate: `CBB-${100 + n}`,
        carrier: 'Transportes DEMO SRL',
        capacityLiters: 30000,
        currentLoadLiters: 0,
        status: CisternStatus.AVAILABLE,
        driverId: n === 1 ? driverId : null,
        currentBatchId: null,
        isDemo: true,
      },
    });
    fleet.push(cistern);
  }

  let deliveredByBatch = new Map<string, number>();
  let i = 0;
  for (const station of stations) {
    const batch = batches[i % batches.length];
    const cistern = fleet[i % fleet.length];
    const volume = 8000 + (i % 4) * 500;
    const water = station.code === 'ST-CBB-08';
    const tokenId = `BT-DEMO-${station.code}-${i + 1}`;
    const payload = {
      batchCode: batch.batchCode,
      stationCode: station.code,
      cisternCode: cistern.code,
      volumeLiters: volume,
      label: 'DEMO',
    };
    const delivery = await prisma.delivery.create({
      data: {
        batchId: batch.id,
        cisternId: cistern.id,
        destinationStationId: station.id,
        status: DeliveryStatus.DELIVERED,
        loadedLiters: volume,
        receivedLiters: volume - 20,
        loadDensity: water ? 0.81 : 0.746,
        loadTemperature: 22.1,
        loadWaterDetected: water,
        loadCertificateStatus: 'DEMO',
        receivedDensity: water ? 0.81 : 0.746,
        receivedTemperature: 22.4,
        receivedWaterDetected: water,
        loadedAt: hoursAgo(30 - i),
        deliveredAt: hoursAgo(28 - i),
        batonTokenId: tokenId,
        isDemo: true,
      },
    });
    await prisma.custodyBaton.create({
      data: {
        tokenId,
        batchId: batch.id,
        stationId: station.id,
        cisternId: cistern.id,
        deliveryId: delivery.id,
        cisternCode: cistern.code,
        eventType: 'RECEIVED',
        volumeLiters: volume,
        payloadJson: payload,
        payloadHash: demoHash(JSON.stringify(payload)),
        signature: demoHash(`sig:${tokenId}`),
        status: BatonStatus.CONSUMED,
        issuedByRole: 'TRANSPORTER',
        consumedByRole: 'STATION_STAFF',
        issuedAt: hoursAgo(30 - i),
        consumedAt: hoursAgo(28 - i),
        isDemo: true,
      },
    });
    deliveredByBatch.set(
      batch.id,
      (deliveredByBatch.get(batch.id) ?? 0) + volume - 20,
    );
    i += 1;
  }

  for (const [batchId, liters] of deliveredByBatch) {
    await prisma.fuelBatch.update({
      where: { id: batchId },
      data: { deliveredLiters: liters },
    });
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
      origin: 'Argentina (DEMO)',
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
    { eventType: 'CREATED', hours: 120, actorId: opts.actors.importer, location: 'Argentina (DEMO)', declared: opts.declared },
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
      result: 'PASS (DEMO)',
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
      origin: 'Terminal Terrestre Arica / Sica Sica (DEMO)',
      destination: 'Cochabamba, Bolivia (DEMO)',
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
      location: 'Descarga buque Terminal Marítima Sica Sica (DEMO)',
    },
    {
      eventType: 'INSPECTED' as const,
      hours: 40,
      location: 'Terminal Terrestre Arica — tanques (DEMO)',
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
      origin: 'Terminal Terrestre Arica / Sica Sica (DEMO)',
      destination: 'Santa Cruz, Bolivia (DEMO)',
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
      location: 'Programación buque → Sica Sica Arica (DEMO)',
      declared: opts.declared,
    },
    {
      eventType: 'LOADED',
      hours: 180,
      actorId: opts.actors.transporter,
      location: 'Descarga marítima Sica Sica (DEMO)',
      declared: opts.declared,
    },
    {
      eventType: 'INSPECTED',
      hours: 178,
      location: 'Terminal Terrestre Arica (DEMO)',
      declared: opts.declared,
    },
    {
      eventType: 'IN_TRANSIT',
      hours: 160,
      actorId: opts.actors.transporter,
      location: 'Cisternas Arica → Bolivia (DEMO)',
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
      result: 'PASS (DEMO) — parameters are not regulatory claims',
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
        'ANOMALY / DISCREPANCY (DEMO). Possible causes include measurement error, calibration, temperature, operational differences, incorrect documentation, physical loss, or other factors. Not an automatic finding of theft or corruption.',
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
      body: 'Caso abierto (DEMO). Pendiente revisión de evidencias. No se atribuye culpabilidad automática.',
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
