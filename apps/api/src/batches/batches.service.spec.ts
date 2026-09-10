import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BatchesService', () => {
  let service: BatchesService;

  const prismaMock = {
    fuelBatch: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    custodyEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return arg(prismaMock);
      }
      return Promise.all(arg as Promise<unknown>[]);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(BatchesService);
  });

  it('creates a batch with CREATED custody event and generated code', async () => {
    prismaMock.fuelBatch.count.mockResolvedValue(183);
    prismaMock.fuelBatch.findUnique.mockResolvedValue(null);
    const created = {
      id: 'b1',
      batchCode: 'FC-BO-2026-000184',
      product: 'Gasolina Especial',
      declaredVolumeLiters: { toString: () => '100000' },
      originCountry: 'Argentina',
      destination: 'Bolivia',
      supplier: 'Demo Supplier',
      importer: 'Demo Importer',
      status: 'DRAFT',
      isDemo: true,
    };
    prismaMock.fuelBatch.create.mockResolvedValue(created);
    prismaMock.custodyEvent.create.mockResolvedValue({ id: 'c1' });

    const result = await service.create({
      product: 'Gasolina Especial',
      declaredVolumeLiters: 100000,
      originCountry: 'Argentina',
      destination: 'Bolivia',
      supplier: 'Demo Supplier',
      importer: 'Demo Importer',
    });

    expect(prismaMock.fuelBatch.create).toHaveBeenCalled();
    expect(prismaMock.custodyEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventType: 'CREATED' }),
      }),
    );
    expect(result.batchCode).toBe('FC-BO-2026-000184');
  });

  it('rejects duplicate batch codes', async () => {
    prismaMock.fuelBatch.findUnique.mockResolvedValue({ id: 'exists' });
    await expect(
      service.create({
        batchCode: 'FC-BO-2026-000184',
        product: 'Gasolina Especial',
        declaredVolumeLiters: 100000,
        originCountry: 'Argentina',
        destination: 'Bolivia',
        supplier: 'Demo Supplier',
        importer: 'Demo Importer',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFound when batch missing', async () => {
    prismaMock.fuelBatch.findFirst.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
