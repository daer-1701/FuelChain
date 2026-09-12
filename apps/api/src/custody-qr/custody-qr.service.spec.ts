import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ActorRole, Prisma } from '@prisma/client';
import { CustodyQrService } from './custody-qr.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth.service';

const transporter: AuthUser = {
  id: 'user-transporter',
  email: 'chofer@fuelchain.bo',
  name: 'Chofer',
  role: ActorRole.TRANSPORTER,
  isDemo: true,
};

const stationStaff: AuthUser = {
  id: 'user-station',
  email: 'estacion@fuelchain.bo',
  name: 'Estación',
  role: ActorRole.STATION_STAFF,
  isDemo: true,
  stationId: 'st1',
  stationCode: 'ST-CBB-01',
};

function prismaHarness() {
  const prisma = {
    fuelBatch: {
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    custodyBaton: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      updateMany: jest.fn(),
    },
    transport: { findFirst: jest.fn().mockResolvedValue(null) },
    vehicle: { findFirst: jest.fn().mockResolvedValue(null) },
    custodyEvent: { create: jest.fn() },
    storageTank: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    station: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    cistern: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    },
    delivery: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _sum: { loadedLiters: null } }),
    },
    qualityCertificate: { findFirst: jest.fn().mockResolvedValue(null) },
    measurement: { create: jest.fn() },
    offlineSyncEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
    fn(prisma),
  );
  return prisma;
}

describe('CustodyQrService', () => {
  let service: CustodyQrService;
  let prisma: ReturnType<typeof prismaHarness>;

  beforeEach(() => {
    process.env.CUSTODY_QR_SECRET = 'test-custody-qr-secret';
    prisma = prismaHarness();
    service = new CustodyQrService(prisma as unknown as PrismaService);
    prisma.station.findUnique.mockResolvedValue({
      id: 'st1',
      code: 'ST-CBB-01',
    });
    prisma.cistern.findUnique.mockResolvedValue({
      id: 'cis1',
      code: 'CIS-CBB-01',
      capacityLiters: new Prisma.Decimal(30000),
      currentLoadLiters: new Prisma.Decimal(0),
      driverId: transporter.id,
    });
    prisma.storageTank.findFirst.mockResolvedValue({
      id: 'depot1',
      name: 'TANK-001',
      capacityLiters: new Prisma.Decimal(500000),
      currentStockLiters: new Prisma.Decimal(200000),
    });
    prisma.fuelBatch.findFirst.mockImplementation(async () => ({
      id: 'b1',
      batchCode: 'FC-BO-2026-000182',
      status: 'AUTHORIZED',
      currentLocation: 'Arica',
      declaredVolumeLiters: new Prisma.Decimal(150000),
      deliveredLiters: new Prisma.Decimal(0),
      qualityStatus: 'PASSED',
    }));
  });

  it('fails fast without CUSTODY_QR_SECRET', async () => {
    delete process.env.CUSTODY_QR_SECRET;
    prisma.fuelBatch.findFirst.mockResolvedValue({
      id: 'b1',
      batchCode: 'FC-BO-2026-000182',
      status: 'IN_TRANSIT',
      currentLocation: 'Arica',
    });
    await expect(
      service.issue(
        {
          batchCode: 'FC-BO-2026-000182',
          eventType: 'IN_TRANSIT',
          volumeLiters: 1000,
          stationCode: 'ST-CBB-01',
          cisternCode: 'CIS-CBB-01',
        },
        transporter,
      ),
    ).rejects.toThrow('CUSTODY_QR_SECRET is required');
  });

  it('issues a baton signed with the session role, ignoring client role claims', async () => {
    prisma.fuelBatch.findFirst.mockResolvedValue({
      id: 'b1',
      batchCode: 'FC-BO-2026-000182',
      status: 'AUTHORIZED',
      currentLocation: 'Arica',
      declaredVolumeLiters: new Prisma.Decimal(150000),
      deliveredLiters: new Prisma.Decimal(0),
      qualityStatus: 'PASSED',
    });
    prisma.custodyBaton.create.mockImplementation(async ({ data }) => data);
    prisma.fuelBatch.update.mockResolvedValue({});
    prisma.delivery.create.mockResolvedValue({ id: 'del1' });

    const result = await service.issue(
      {
        batchCode: 'FC-BO-2026-000182',
        eventType: 'IN_TRANSIT',
        volumeLiters: 24800,
        cisternCode: 'CIS-CBB-07',
        stationCode: 'ST-CBB-01',
      },
      transporter,
    );

    expect(result.data.issuedByRole).toBe(ActorRole.TRANSPORTER);
    expect(result.data.qrPayload.role).toBe(ActorRole.TRANSPORTER);
    expect(result.data.qrPayload.iss).toBe(transporter.id);
    expect(result.data.qrPayload.exp).toBeGreaterThan(result.data.qrPayload.ts);
    expect(prisma.fuelBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'IN_TRANSIT' }),
      }),
    );
    expect(prisma.transport.findFirst).toHaveBeenCalled();
  });

  it('rejects QR issue from DRAFT', async () => {
    prisma.fuelBatch.findFirst.mockResolvedValue({
      id: 'b1',
      batchCode: 'FC-BO-2026-000182',
      status: 'DRAFT',
      declaredVolumeLiters: new Prisma.Decimal(150000),
    });
    await expect(
      service.issue(
        {
          batchCode: 'FC-BO-2026-000182',
          eventType: 'IN_TRANSIT',
          volumeLiters: 24800,
          stationCode: 'ST-CBB-01',
          cisternCode: 'CIS-CBB-01',
        },
        transporter,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an expired baton and marks it EXPIRED', async () => {
    prisma.custodyBaton.findUnique.mockResolvedValue({
      id: 'baton-1',
      tokenId: 'BT-DEAD',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() - 1000),
      batchId: 'b1',
      volumeLiters: new Prisma.Decimal(1000),
      batch: { id: 'b1', status: 'IN_TRANSIT' },
    });
    prisma.custodyBaton.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.accept({ tokenId: 'BT-DEAD' }, stationStaff),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.custodyBaton.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'EXPIRED' },
      }),
    );
  });

  it('rejects a already consumed baton', async () => {
    prisma.custodyBaton.findUnique.mockResolvedValue({
      id: 'baton-1',
      tokenId: 'BT-USED',
      status: 'CONSUMED',
      expiresAt: new Date(Date.now() + 60_000),
      batch: { id: 'b1' },
    });
    await expect(
      service.accept({ tokenId: 'BT-USED' }, stationStaff),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('consumes atomically so a second concurrent accept fails', async () => {
    const baton = {
      id: 'baton-1',
      tokenId: 'BT-RACE',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 60_000),
      batchId: 'b1',
      volumeLiters: new Prisma.Decimal(5000),
      cisternCode: 'CIS-1',
      stationId: 'st1',
      batch: { id: 'b1', status: 'IN_TRANSIT' },
    };
    prisma.custodyBaton.findUnique.mockResolvedValue(baton);
    prisma.station.findUnique.mockResolvedValue({ id: 'st1', code: 'ST-CBB-01' });
    prisma.fuelBatch.findUniqueOrThrow.mockResolvedValue({
      id: 'b1',
      status: 'IN_TRANSIT',
      currentLocation: 'ruta',
      declaredVolumeLiters: new Prisma.Decimal(150000),
      deliveredLiters: new Prisma.Decimal(0),
    });
    prisma.storageTank.findFirst.mockResolvedValue({
      id: 'tk1',
      currentStockLiters: new Prisma.Decimal(10000),
      capacityLiters: new Prisma.Decimal(45000),
    });
    prisma.custodyEvent.create.mockResolvedValue({});
    prisma.fuelBatch.update.mockResolvedValue({});
    prisma.storageTank.update.mockResolvedValue({});
    prisma.station.update.mockResolvedValue({});
    prisma.measurement.create.mockResolvedValue({});
    prisma.custodyBaton.findUniqueOrThrow.mockResolvedValue({
      ...baton,
      status: 'CONSUMED',
      consumedByRole: ActorRole.STATION_STAFF,
    });

    let consumed = false;
    prisma.custodyBaton.updateMany.mockImplementation(async () => {
      if (!consumed) {
        consumed = true;
        return { count: 1 };
      }
      return { count: 0 };
    });

    const first = service.accept(
      {
        tokenId: 'BT-RACE',
        stationCode: 'ST-CBB-01',
        receivedVolumeLiters: 5000,
        receivedDensity: 0.74,
        receivedTemperature: 21,
        receivedWaterDetected: false,
      },
      stationStaff,
    );
    const second = service.accept(
      {
        tokenId: 'BT-RACE',
        stationCode: 'ST-CBB-01',
        receivedVolumeLiters: 5000,
        receivedDensity: 0.74,
        receivedTemperature: 21,
        receivedWaterDetected: false,
      },
      stationStaff,
    );
    const results = await Promise.allSettled([first, second]);
    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
  });

  it('updates inventory as previous + received, not received/capacity', async () => {
    const baton = {
      id: 'baton-1',
      tokenId: 'BT-INV',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 60_000),
      batchId: 'b1',
      volumeLiters: new Prisma.Decimal(5000),
      cisternCode: 'CIS-1',
      stationId: 'st1',
      batch: { id: 'b1', status: 'IN_TRANSIT' },
    };
    prisma.custodyBaton.findUnique.mockResolvedValue(baton);
    prisma.station.findUnique.mockResolvedValue({ id: 'st1', code: 'ST-CBB-01' });
    prisma.custodyBaton.updateMany.mockResolvedValue({ count: 1 });
    prisma.custodyEvent.create.mockResolvedValue({
      id: 'evt-1',
      eventType: 'RECEIVED',
    });
    prisma.fuelBatch.findUniqueOrThrow.mockResolvedValue({
      id: 'b1',
      status: 'IN_TRANSIT',
      currentLocation: 'ruta',
      declaredVolumeLiters: new Prisma.Decimal(150000),
      deliveredLiters: new Prisma.Decimal(0),
    });
    prisma.fuelBatch.update.mockResolvedValue({});
    prisma.storageTank.findFirst.mockResolvedValue({
      id: 'tk1',
      currentStockLiters: new Prisma.Decimal(10000),
      capacityLiters: new Prisma.Decimal(45000),
    });
    prisma.storageTank.update.mockResolvedValue({});
    prisma.station.update.mockResolvedValue({});
    prisma.measurement.create.mockResolvedValue({});
    prisma.custodyBaton.findUniqueOrThrow.mockResolvedValue({
      ...baton,
      status: 'CONSUMED',
      consumedByRole: ActorRole.STATION_STAFF,
    });

    await service.accept(
      {
        tokenId: 'BT-INV',
        stationCode: 'ST-CBB-01',
        receivedVolumeLiters: 5000,
        receivedDensity: 0.74,
        receivedTemperature: 21,
        receivedWaterDetected: false,
      },
      stationStaff,
    );

    expect(prisma.storageTank.update).toHaveBeenCalledWith({
      where: { id: 'tk1' },
      data: { currentStockLiters: expect.anything() },
    });
    const stockArg = prisma.storageTank.update.mock.calls[0][0].data
      .currentStockLiters as Prisma.Decimal;
    expect(stockArg.toString()).toBe('15000');
    expect(prisma.measurement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          volumeLiters: expect.anything(),
        }),
      }),
    );
    expect(prisma.fuelBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'RECEIVED' }),
      }),
    );
    expect(prisma.custodyEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'RECEIVED',
          actorId: stationStaff.id,
        }),
      }),
    );
    expect(prisma.custodyBaton.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          consumedByRole: ActorRole.STATION_STAFF,
        }),
      }),
    );
  });

  it('rejects overflow when stock + received exceeds capacity', async () => {
    prisma.custodyBaton.findUnique.mockResolvedValue({
      id: 'baton-1',
      tokenId: 'BT-OVR',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 60_000),
      batchId: 'b1',
      volumeLiters: new Prisma.Decimal(40000),
      stationId: 'st1',
      batch: { id: 'b1', status: 'IN_TRANSIT' },
    });
    prisma.station.findUnique.mockResolvedValue({ id: 'st1', code: 'ST-CBB-01' });
    prisma.custodyBaton.updateMany.mockResolvedValue({ count: 1 });
    prisma.custodyEvent.create.mockResolvedValue({});
    prisma.fuelBatch.findUniqueOrThrow.mockResolvedValue({
      id: 'b1',
      status: 'IN_TRANSIT',
      declaredVolumeLiters: new Prisma.Decimal(150000),
      deliveredLiters: new Prisma.Decimal(0),
    });
    prisma.storageTank.findFirst.mockResolvedValue({
      id: 'tk1',
      currentStockLiters: new Prisma.Decimal(10000),
      capacityLiters: new Prisma.Decimal(45000),
    });

    await expect(
      service.accept(
        {
          tokenId: 'BT-OVR',
          stationCode: 'ST-CBB-01',
          receivedVolumeLiters: 40000,
          receivedDensity: 0.74,
          receivedTemperature: 21,
          receivedWaterDetected: false,
        },
        stationStaff,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sync is idempotent on clientEventId', async () => {
    prisma.offlineSyncEvent.findUnique.mockResolvedValue({
      clientEventId: 'off-1',
      status: 'APPLIED',
    });
    const result = await service.syncOffline(
      [
        {
          clientEventId: 'off-1',
          eventType: 'ACCEPT_BATON',
          payload: {},
          capturedAt: new Date().toISOString(),
        },
        {
          clientEventId: 'off-1',
          eventType: 'ACCEPT_BATON',
          payload: {},
          capturedAt: new Date().toISOString(),
        },
      ],
      stationStaff,
    );
    expect(result.results).toEqual([
      { clientEventId: 'off-1', status: 'APPLIED' },
      { clientEventId: 'off-1', status: 'APPLIED' },
    ]);
    expect(prisma.offlineSyncEvent.create).not.toHaveBeenCalled();
  });

  it('rejects an embedded baton with an invalid signature', async () => {
    await expect(
      service.accept(
        {
          tokenId: 'BT-FAKE',
          embedded: {
            v: 1,
            t: 'baton',
            id: 'BT-FAKE',
            batch: 'FC-BO-2026-000182',
            vol: 1000,
            ev: 'IN_TRANSIT',
            ts: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            h: 'deadbeef',
            s: 'not-a-real-hmac',
          },
        },
        stationStaff,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects embedded payload signed with a different secret', async () => {
    prisma.fuelBatch.findFirst.mockResolvedValue({
      id: 'b1',
      batchCode: 'FC-BO-2026-000182',
      status: 'IN_TRANSIT',
      currentLocation: 'ruta',
    });
    prisma.custodyBaton.create.mockImplementation(async ({ data }) => data);
    const issued = await service.issue(
      {
        batchCode: 'FC-BO-2026-000182',
        eventType: 'IN_TRANSIT',
        volumeLiters: 1000,
        stationCode: 'ST-CBB-01',
        cisternCode: 'CIS-CBB-01',
      },
      transporter,
    );
    process.env.CUSTODY_QR_SECRET = 'another-secret';
    prisma.custodyBaton.findUnique.mockResolvedValue(null);
    await expect(
      service.accept(
        {
          tokenId: issued.data.tokenId,
          embedded: issued.data.qrPayload,
        },
        stationStaff,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
