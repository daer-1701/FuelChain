import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

/** Litros aún disponibles para despachar (declarado − recibido − en tránsito). */
export function remainingBatchLiters(input: {
  declaredLiters: Decimal | string | number;
  deliveredLiters: Decimal | string | number;
  /** Litros ya cargados en entregas LOADED / IN_TRANSIT (aún no recibidos). */
  reservedLiters?: Decimal | string | number;
}): number {
  const declared = Number(input.declaredLiters.toString());
  const delivered = Number(input.deliveredLiters.toString());
  const reserved = Number((input.reservedLiters ?? 0).toString());
  if (!Number.isFinite(declared) || declared <= 0) return 0;
  return Math.max(0, declared - delivered - reserved);
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
