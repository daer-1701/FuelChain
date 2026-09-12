import { ActorRole } from '@prisma/client';

/** Mutating role sets — least privilege aligned to FuelChain jobs. */
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
  ],
  /** Solo estación (o admin) confirma recepción en EESS. */
  qrAccept: [ActorRole.ADMIN, ActorRole.STATION_STAFF],
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
    ActorRole.DEPOT_OPERATOR,
    ActorRole.STATION_STAFF,
  ],
  anomalyStatus: [ActorRole.ADMIN, ActorRole.AUDITOR, ActorRole.VERIFIER],
  auditWrite: [ActorRole.ADMIN, ActorRole.AUDITOR, ActorRole.VERIFIER],
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
    ActorRole.DEPOT_OPERATOR,
  ],
  checkpointWrite: [
    ActorRole.ADMIN,
    ActorRole.TRANSPORTER,
    ActorRole.DEPOT_OPERATOR,
  ],
  checkpointRead: [
    ActorRole.ADMIN,
    ActorRole.TRANSPORTER,
    ActorRole.DEPOT_OPERATOR,
    ActorRole.STATION_STAFF,
    ActorRole.VERIFIER,
    ActorRole.AUDITOR,
  ],
} as const;
