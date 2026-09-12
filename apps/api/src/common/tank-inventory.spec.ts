import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { applyStockDelta } from './tank-inventory';

describe('applyStockDelta', () => {
  it('adds reception as a delta on previous stock', () => {
    const result = applyStockDelta({
      previousStock: 10000,
      receivedLiters: 5000,
      capacityLiters: 45000,
    });
    expect(result.nextStock.toString()).toBe('15000');
    expect(result.previousStock.toString()).toBe('10000');
  });

  it('rejects overflow instead of silently clipping', () => {
    expect(() =>
      applyStockDelta({
        previousStock: new Decimal(10000),
        receivedLiters: 40000,
        capacityLiters: new Decimal(45000),
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects non-positive reception', () => {
    expect(() =>
      applyStockDelta({
        previousStock: 10000,
        receivedLiters: 0,
        capacityLiters: 45000,
      }),
    ).toThrow(BadRequestException);
  });
});
