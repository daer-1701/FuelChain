import { ActorRole, Prisma } from '@prisma/client';
import { CustodyQrService } from './custody-qr.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth.service';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://fuelchain:fuelchain@localhost:5432/fuelchain?schema=public';

const stationStaff: AuthUser = {
  id: 'concurrency-station',
  email: 'concurrency-station@fuelchain.bo',
  name: 'Concurrency station',
  role: ActorRole.STATION_STAFF,
  isDemo: true,
};

const transporter: AuthUser = {
  id: 'concurrency-transporter',
  email: 'concurrency-transporter@fuelchain.bo',
  name: 'Concurrency transporter',
  role: ActorRole.TRANSPORTER,
  isDemo: true,
};

describe('CustodyQrService concurrent accept (Postgres)', () => {
  let prisma: PrismaService;
  let service: CustodyQrService;
  let available = false;

  beforeAll(async () => {
    process.env.CUSTODY_QR_SECRET = 'test-custody-qr-secret';
    process.env.DATABASE_URL = DATABASE_URL;
    prisma = new PrismaService();
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      available = true;
    } catch {
      available = false;
    }
    service = new CustodyQrService(prisma);
  });

  afterAll(async () => {
    if (available) {
      await prisma.$disconnect();
    }
  });

  it('allows only one of two simultaneous accepts', async () => {
    if (!available) {
      return;
    }

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const batchCode = `FC-BO-TEST-${suffix}`;
    const stationCode = `ST-TEST-${suffix.slice(-6)}`;

    const userT = await prisma.user.create({
      data: {
        id: transporter.id + suffix,
        email: `${suffix}.t@fuelchain.bo`,
        name: transporter.name,
        role: ActorRole.TRANSPORTER,
        isDemo: true,
      },
    });
    const userS = await prisma.user.create({
      data: {
        id: stationStaff.id + suffix,
        email: `${suffix}.s@fuelchain.bo`,
        name: stationStaff.name,
        role: ActorRole.STATION_STAFF,
        isDemo: true,
      },
    });

    const batch = await prisma.fuelBatch.create({
      data: {
        batchCode,
        product: 'Gasolina Especial',
        declaredVolumeLiters: new Prisma.Decimal(100000),
        originCountry: 'Chile',
        destination: 'Bolivia',
        supplier: 'TEST',
        importer: 'TEST',
        status: 'IN_TRANSIT',
        isDemo: true,
      },
    });
    const station = await prisma.station.create({
      data: {
        code: stationCode,
        name: 'Estación test concurrencia',
        city: 'Cochabamba',
        latitude: -17.39,
        longitude: -66.15,
        isDemo: true,
      },
    });
    await prisma.storageTank.create({
      data: {
        name: `TANK-${suffix}`,
        capacityLiters: new Prisma.Decimal(45000),
        currentStockLiters: new Prisma.Decimal(10000),
        location: 'TEST',
        stationId: station.id,
        isDemo: true,
      },
    });

    const actorT = { ...transporter, id: userT.id };
    const actorS = { ...stationStaff, id: userS.id };

    const issued = await service.issue(
      {
        batchCode,
        eventType: 'IN_TRANSIT',
        volumeLiters: 5000,
        stationCode,
      },
      actorT,
    );
    const tokenId = issued.data.tokenId as string;

    const results = await Promise.allSettled([
      service.accept(
        { tokenId, stationCode, receivedVolumeLiters: 5000 },
        actorS,
      ),
      service.accept(
        { tokenId, stationCode, receivedVolumeLiters: 5000 },
        actorS,
      ),
    ]);

    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);

    const events = await prisma.custodyEvent.count({
      where: { batchId: batch.id, eventType: 'RECEIVED' },
    });
    expect(events).toBe(1);

    const tank = await prisma.storageTank.findFirst({
      where: { stationId: station.id },
    });
    expect(tank?.currentStockLiters.toString()).toBe('15000');

    await prisma.offlineSyncEvent.deleteMany({
      where: { batonTokenId: tokenId },
    });
    await prisma.measurement.deleteMany({ where: { batchId: batch.id } });
    await prisma.custodyEvent.deleteMany({ where: { batchId: batch.id } });
    await prisma.custodyBaton.deleteMany({ where: { batchId: batch.id } });
    await prisma.storageTank.deleteMany({ where: { stationId: station.id } });
    await prisma.station.delete({ where: { id: station.id } });
    await prisma.fuelBatch.delete({ where: { id: batch.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [userT.id, userS.id] } },
    });
  });
});
