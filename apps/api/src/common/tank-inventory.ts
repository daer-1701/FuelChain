import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

export type TankAvailability = 'FULL' | 'MEDIUM' | 'LOW' | 'EMPTY';

export function availabilityFromFillRatio(
  fillRatio: number,
): TankAvailability {
  if (fillRatio >= 0.7) return 'FULL';
  if (fillRatio >= 0.35) return 'MEDIUM';
  if (fillRatio > 0.05) return 'LOW';
  return 'EMPTY';
}

/**
 * Reception is a DELTA on persisted stock, never "received / capacity".
 * Uses Prisma Decimal — not IEEE floats — for the accounting step.
 */
export function applyStockDelta(input: {
  previousStock: Decimal | string | number;
  receivedLiters: number;
  capacityLiters: Decimal | string | number;
}) {
  if (!Number.isFinite(input.receivedLiters) || input.receivedLiters <= 0) {
    throw new BadRequestException('receivedVolumeLiters must be greater than 0');
  }

  const previous = new Decimal(input.previousStock.toString());
  const received = new Decimal(input.receivedLiters);
  const capacity = new Decimal(input.capacityLiters.toString());
  const nextStock = previous.plus(received);

  if (nextStock.gt(capacity)) {
    throw new BadRequestException(
      `Tank overflow: stock ${previous.toString()} + received ${received.toString()} exceeds capacity ${capacity.toString()}`,
    );
  }

  const capNum = Number(capacity.toString());
  const fillRatio = capNum > 0 ? Number(nextStock.toString()) / capNum : 0;

  return {
    previousStock: previous,
    received,
    nextStock,
    fillRatio,
    availability: availabilityFromFillRatio(fillRatio),
  };
}
