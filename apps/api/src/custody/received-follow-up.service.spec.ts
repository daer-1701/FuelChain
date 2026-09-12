import { AnomalyType } from '@prisma/client';
import { ReceivedFollowUpService, movementAnomalyKey } from './received-follow-up.service';

describe('ReceivedFollowUpService', () => {
  it('creates a volume signal once per custody event', async () => {
    const prisma = {
      anomaly: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async ({ data }) => data),
      },
    };
    const blockchain = {
      anchorCustodyReceivedBestEffort: jest.fn().mockResolvedValue({
        status: 'PENDING',
      }),
    };
    const service = new ReceivedFollowUpService(
      prisma as never,
      blockchain as never,
    );

    const event = {
      id: 'evt-9',
      batchId: 'b1',
      eventType: 'RECEIVED',
      actorId: 'u1',
      location: 'Estación ST-CBB-01 (Cochabamba)',
      declaredVolume: 24800,
      measuredVolume: 20000,
      timestamp: new Date('2026-09-11T20:00:00.000Z'),
      metadata: { cisternCode: 'CIS-CBB-07' },
    };

    const first = await service.afterReceived(event, {
      id: 'b1',
      batchCode: 'FC-BO-2026-000182',
    });
    expect(first.reconciliation.status).toBe('ANOMALY');
    expect(first.anomaly?.type).toBe(AnomalyType.VOLUME_DISCREPANCY);
    expect(first.anomaly?.expected).toBe(movementAnomalyKey('evt-9'));
    expect(first.anomaly?.explanation).toMatch(/≠ robo|no es un hallazgo/i);
    expect(blockchain.anchorCustodyReceivedBestEffort).toHaveBeenCalledTimes(1);

    prisma.anomaly.findFirst.mockResolvedValue(first.anomaly);
    const second = await service.afterReceived(event, {
      id: 'b1',
      batchCode: 'FC-BO-2026-000182',
    });
    expect(prisma.anomaly.create).toHaveBeenCalledTimes(1);
    expect(second.anomaly).toBe(first.anomaly);
  });

  it('does not create an anomaly on MATCH', async () => {
    const prisma = {
      anomaly: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };
    const blockchain = {
      anchorCustodyReceivedBestEffort: jest.fn().mockResolvedValue({
        status: 'PENDING',
      }),
    };
    const service = new ReceivedFollowUpService(
      prisma as never,
      blockchain as never,
    );
    const result = await service.afterReceived(
      {
        id: 'evt-ok',
        batchId: 'b1',
        eventType: 'RECEIVED',
        actorId: 'u1',
        location: 'Estación',
        declaredVolume: 24800,
        measuredVolume: 24800,
        timestamp: new Date(),
        metadata: null,
      },
      { id: 'b1', batchCode: 'FC-BO-2026-000182' },
    );
    expect(result.reconciliation.status).toBe('MATCH');
    expect(result.anomaly).toBeNull();
    expect(prisma.anomaly.create).not.toHaveBeenCalled();
  });
});
