import { BadRequestException } from '@nestjs/common';
import { BatchStatus } from '@prisma/client';

/**
 * Minimal forward-only MVP machine.
 * AUDIT_REQUIRED can be entered from any status and does not regress the
 * operational stage; leaving it requires an explicit PATCH by an auditor.
 */
const FORWARD: BatchStatus[] = [
  BatchStatus.DRAFT,
  BatchStatus.AUTHORIZED,
  BatchStatus.IN_TRANSIT,
  BatchStatus.AT_BORDER,
  BatchStatus.CUSTOMS,
  BatchStatus.RECEIVED,
  BatchStatus.SAMPLING,
  BatchStatus.LAB_ANALYSIS,
  BatchStatus.CERTIFIED,
  BatchStatus.STORED,
  BatchStatus.DISTRIBUTING,
  BatchStatus.DELIVERED,
  BatchStatus.COMPLETED,
];

export function canTransition(from: BatchStatus, to: BatchStatus): boolean {
  if (from === to) return true;
  if (to === BatchStatus.AUDIT_REQUIRED) return true;
  if (from === BatchStatus.AUDIT_REQUIRED) {
    return to !== BatchStatus.DRAFT;
  }
  const fi = FORWARD.indexOf(from);
  const ti = FORWARD.indexOf(to);
  if (fi === -1 || ti === -1) return false;
  return ti >= fi;
}

export function assertCanTransition(from: BatchStatus, to: BatchStatus): void {
  if (!canTransition(from, to)) {
    throw new BadRequestException(
      `Transición de estado no permitida: ${from} → ${to}`,
    );
  }
}

/** QR de transporte: no desde borrador ni lote ya cerrado. */
export function canIssueQr(status: BatchStatus): boolean {
  return (
    status !== BatchStatus.DRAFT &&
    status !== BatchStatus.COMPLETED &&
    status !== BatchStatus.DELIVERED
  );
}

/**
 * Recepción de un movimiento: exige que el lote ya esté en tránsito
 * (o más adelante). No desde DRAFT/AUTHORIZED/COMPLETED.
 */
export function canReceiveBatch(status: BatchStatus): boolean {
  return (
    status === BatchStatus.IN_TRANSIT ||
    status === BatchStatus.AT_BORDER ||
    status === BatchStatus.CUSTOMS ||
    status === BatchStatus.RECEIVED ||
    status === BatchStatus.SAMPLING ||
    status === BatchStatus.LAB_ANALYSIS ||
    status === BatchStatus.CERTIFIED ||
    status === BatchStatus.STORED ||
    status === BatchStatus.DISTRIBUTING ||
    status === BatchStatus.AUDIT_REQUIRED
  );
}
