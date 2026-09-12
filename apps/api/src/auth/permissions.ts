import { ActorRole } from '@prisma/client';

/** Mutating role sets — least privilege for the current MVP (no Dispatch yet). */
export const RolesAllowed = {
  batchCreate: [ActorRole.ADMIN, ActorRole.IMPORTER],
  batchUpdate: [ActorRole.ADMIN, ActorRole.IMPORTER, ActorRole.AUDITOR],
  batchDelete: [ActorRole.ADMIN],
  custodyWrite: [
    ActorRole.ADMIN,
    ActorRole.IMPORTER,
    ActorRole.TRANSPORTER,
    ActorRole.DEPOT_OPERATOR,
    ActorRole.STATION_STAFF,
  ],
  qrIssue: [
    ActorRole.ADMIN,
    ActorRole.TRANSPORTER,
    ActorRole.DEPOT_OPERATOR,
    ActorRole.IMPORTER,
  ],
  qrAccept: [ActorRole.ADMIN, ActorRole.STATION_STAFF, ActorRole.DEPOT_OPERATOR],
  qrSync: [
    ActorRole.ADMIN,
    ActorRole.STATION_STAFF,
    ActorRole.DEPOT_OPERATOR,
    ActorRole.TRANSPORTER,
  ],
  blockchainAnchor: [
    ActorRole.ADMIN,
    ActorRole.AUDITOR,
    ActorRole.IMPORTER,
    ActorRole.VERIFIER,
  ],
  vehiclesWrite: [
    ActorRole.ADMIN,
    ActorRole.TRANSPORTER,
    ActorRole.DEPOT_OPERATOR,
    ActorRole.IMPORTER,
  ],
  documentsWrite: [
    ActorRole.ADMIN,
    ActorRole.IMPORTER,
    ActorRole.DEPOT_OPERATOR,
    ActorRole.LAB,
    ActorRole.AUDITOR,
  ],
  qualityWrite: [ActorRole.ADMIN, ActorRole.LAB],
  tanksWrite: [
    ActorRole.ADMIN,
    ActorRole.DEPOT_OPERATOR,
    ActorRole.STATION_STAFF,
  ],
  measurementsWrite: [
    ActorRole.ADMIN,
    ActorRole.DEPOT_OPERATOR,
    ActorRole.STATION_STAFF,
    ActorRole.LAB,
  ],
  anomalyCreate: [
    ActorRole.ADMIN,
    ActorRole.AUDITOR,
    ActorRole.VERIFIER,
    ActorRole.DEPOT_OPERATOR,
    ActorRole.STATION_STAFF,
  ],
  anomalyStatus: [ActorRole.ADMIN, ActorRole.AUDITOR],
  auditWrite: [ActorRole.ADMIN, ActorRole.AUDITOR],
  authorizationWrite: [ActorRole.ADMIN, ActorRole.IMPORTER],
  transportWrite: [
    ActorRole.ADMIN,
    ActorRole.IMPORTER,
    ActorRole.TRANSPORTER,
    ActorRole.DEPOT_OPERATOR,
  ],
  customsWrite: [ActorRole.ADMIN, ActorRole.IMPORTER, ActorRole.AUDITOR],
  demoSimulate: [
    ActorRole.ADMIN,
    ActorRole.TRANSPORTER,
    ActorRole.STATION_STAFF,
    ActorRole.DEPOT_OPERATOR,
    ActorRole.AUDITOR,
    ActorRole.IMPORTER,
  ],
} as const;
