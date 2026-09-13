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
    const remaining = capacity.minus(previous);
    const rem = Math.max(0, Number(remaining.toString()));
    throw new BadRequestException(
      `Tanque sin cupo: hay ${previous.toString()} L, capacidad ${capacity.toString()} L (quedan ${rem} L). No entra la recepción de ${received.toString()} L. Liberá stock DEMO o recibí menos litros.`,
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

/** Unload / sale / DEMO consumption — never below zero. */
export function applyStockWithdraw(input: {
  previousStock: Decimal | string | number;
  withdrawLiters: number;
  capacityLiters: Decimal | string | number;
}) {
  if (!Number.isFinite(input.withdrawLiters) || input.withdrawLiters <= 0) {
    throw new BadRequestException('withdrawLiters must be greater than 0');
  }
  const previous = new Decimal(input.previousStock.toString());
  const withdraw = new Decimal(input.withdrawLiters);
  if (withdraw.gt(previous)) {
    throw new BadRequestException(
      `Insufficient stock: ${previous.toString()} < ${withdraw.toString()}`,
    );
  }
  const capacity = new Decimal(input.capacityLiters.toString());
  const nextStock = previous.minus(withdraw);
  const capNum = Number(capacity.toString());
  const fillRatio = capNum > 0 ? Number(nextStock.toString()) / capNum : 0;
  return {
    previousStock: previous,
    withdraw,
    nextStock,
    fillRatio,
    availability: availabilityFromFillRatio(fillRatio),
  };
}

/** ~2 % of capacity per 24 h since last inventory, capped so the tank is never emptied by demo burn. */
export function demoConsumptionLiters(input: {
  stockLiters: number;
  capacityLiters: number;
  lastInventoryAt: Date | string | null;
  now?: Date;
}): number {
  if (!input.lastInventoryAt || input.stockLiters <= 0 || input.capacityLiters <= 0) {
    return 0;
  }
  const last = new Date(input.lastInventoryAt);
  const now = input.now ?? new Date();
  const hours = Math.max(0, (now.getTime() - last.getTime()) / 3_600_000);
  if (hours < 1) return 0;
  const daily = input.capacityLiters * 0.02;
  const raw = (daily * hours) / 24;
  const floor = input.capacityLiters * 0.04;
  const maxBurn = Math.max(0, input.stockLiters - floor);
  return Math.min(raw, maxBurn, input.stockLiters);
}
