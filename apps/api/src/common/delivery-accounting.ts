import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

export function remainingBatchLiters(input: {
  declaredLiters: Decimal | string | number;
  deliveredLiters: Decimal | string | number;
}): number {
  const declared = Number(input.declaredLiters.toString());
  const delivered = Number(input.deliveredLiters.toString());
  return Math.max(0, declared - delivered);
}

export function assertCisternCanLoad(input: {
  capacityLiters: Decimal | string | number;
  currentLoadLiters: Decimal | string | number;
  loadLiters: number;
}) {
  if (!Number.isFinite(input.loadLiters) || input.loadLiters <= 0) {
    throw new BadRequestException('Los litros de carga deben ser > 0');
  }
  const cap = Number(input.capacityLiters.toString());
  const cur = Number(input.currentLoadLiters.toString());
  if (cur + input.loadLiters > cap + 0.001) {
    throw new BadRequestException(
      `Cisterna sin cupo: ${cur} + ${input.loadLiters} > ${cap}`,
    );
  }
}

export function nextCisternLoad(input: {
  currentLoadLiters: Decimal | string | number;
  deltaLiters: number;
}): Decimal {
  const next = new Decimal(input.currentLoadLiters.toString()).plus(
    input.deltaLiters,
  );
  if (next.lt(0)) {
    throw new BadRequestException('La cisterna no puede quedar en negativo');
  }
  return next;
}
