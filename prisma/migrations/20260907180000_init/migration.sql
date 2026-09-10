-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."ActorRole" AS ENUM ('ADMIN', 'IMPORTER', 'TRANSPORTER', 'DEPOT_OPERATOR', 'LAB', 'AUDITOR');

-- CreateEnum
CREATE TYPE "public"."BatchStatus" AS ENUM ('DRAFT', 'AUTHORIZED', 'IN_TRANSIT', 'AT_BORDER', 'CUSTOMS', 'RECEIVED', 'SAMPLING', 'LAB_ANALYSIS', 'CERTIFIED', 'STORED', 'DISTRIBUTING', 'DELIVERED', 'COMPLETED', 'AUDIT_REQUIRED');

-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."TransportType" AS ENUM ('TRUCK', 'RAIL', 'WATER', 'PIPELINE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TransportStatus" AS ENUM ('PLANNED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."AuthorizationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."CustodyEventType" AS ENUM ('CREATED', 'LOADED', 'INSPECTED', 'IN_TRANSIT', 'ENTERED_COUNTRY', 'CUSTOMS', 'RECEIVED', 'SAMPLED', 'LAB_ANALYSIS', 'CERTIFIED', 'STORED', 'DISPATCHED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('CERTIFICATE_OF_ORIGIN', 'QUALITY_CERTIFICATE', 'CUSTOMS_DOCUMENT', 'TRANSPORT_DOCUMENT', 'LAB_RESULT', 'INSPECTION_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."CertificateStatus" AS ENUM ('PENDING', 'VALID', 'EXPIRED', 'REVOKED', 'DEMO');

-- CreateEnum
CREATE TYPE "public"."LabResultStatus" AS ENUM ('PENDING', 'PASS', 'FAIL', 'INCONCLUSIVE', 'DEMO');

-- CreateEnum
CREATE TYPE "public"."TankStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "public"."MeasurementSource" AS ENUM ('ESP32', 'SIMULATOR', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."AnomalyType" AS ENUM ('VOLUME_DISCREPANCY', 'DOCUMENTATION', 'TRANSIT_ANOMALY', 'MEASUREMENT_ANOMALY', 'MISSING_EVENTS', 'ROUTE_CHANGE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AnomalySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AnomalyStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'FALSE_POSITIVE');

-- CreateEnum
CREATE TYPE "public"."AuditCaseStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'FALSE_POSITIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."QualityStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'CERTIFIED', 'REJECTED', 'DEMO');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."ActorRole" NOT NULL,
    "walletAddress" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fuel_batches" (
    "id" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "declaredVolumeLiters" DECIMAL(18,3) NOT NULL,
    "originCountry" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "importer" TEXT NOT NULL,
    "status" "public"."BatchStatus" NOT NULL DEFAULT 'DRAFT',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" "public"."RiskLevel" NOT NULL DEFAULT 'LOW',
    "qualityStatus" "public"."QualityStatus" NOT NULL DEFAULT 'PENDING',
    "currentLocation" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_authorizations" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "authorizationType" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "status" "public"."AuthorizationStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "documentId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicles" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "plate" TEXT,
    "carrier" TEXT NOT NULL,
    "capacityLiters" DECIMAL(18,3),
    "status" "public"."VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transports" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "transportType" "public"."TransportType" NOT NULL,
    "carrier" TEXT NOT NULL,
    "vehicleRef" TEXT,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureAt" TIMESTAMP(3),
    "arrivalAt" TIMESTAMP(3),
    "status" "public"."TransportStatus" NOT NULL DEFAULT 'PLANNED',
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customs_events" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "declaredVolume" DECIMAL(18,3),
    "measuredVolume" DECIMAL(18,3),
    "actorId" TEXT,
    "documentId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customs_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."custody_events" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "eventType" "public"."CustodyEventType" NOT NULL,
    "actorId" TEXT,
    "location" TEXT,
    "declaredVolume" DECIMAL(18,3),
    "measuredVolume" DECIMAL(18,3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidenceHash" TEXT,
    "transactionHash" TEXT,
    "metadata" JSONB,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custody_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."DocumentType" NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "sha256Hash" TEXT NOT NULL,
    "uploadedById" TEXT,
    "blockchainTxHash" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quality_certificates" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "certificateType" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."CertificateStatus" NOT NULL DEFAULT 'PENDING',
    "documentId" TEXT,
    "hash" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sampling_events" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "sampleCode" TEXT NOT NULL,
    "takenBy" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sampling_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lab_analyses" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "laboratory" TEXT NOT NULL,
    "analysisDate" TIMESTAMP(3) NOT NULL,
    "parameters" JSONB NOT NULL,
    "result" TEXT,
    "status" "public"."LabResultStatus" NOT NULL DEFAULT 'PENDING',
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."storage_tanks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacityLiters" DECIMAL(18,3) NOT NULL,
    "location" TEXT NOT NULL,
    "status" "public"."TankStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_tanks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."measurements" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "tankId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "volumeLiters" DECIMAL(18,3) NOT NULL,
    "temperature" DECIMAL(8,2),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "public"."MeasurementSource" NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."anomalies" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "type" "public"."AnomalyType" NOT NULL,
    "severity" "public"."AnomalySeverity" NOT NULL DEFAULT 'MEDIUM',
    "expected" TEXT,
    "actual" TEXT,
    "difference" TEXT,
    "riskImpact" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."AnomalyStatus" NOT NULL DEFAULT 'OPEN',
    "explanation" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_cases" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "anomalyId" TEXT,
    "title" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."AuditCaseStatus" NOT NULL DEFAULT 'OPEN',
    "assigneeId" TEXT,
    "aiExplanation" TEXT,
    "blockchainTxHash" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_notes" (
    "id" TEXT NOT NULL,
    "auditCaseId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blockchain_anchors" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "eventKind" TEXT NOT NULL,
    "eventId" TEXT,
    "dataHash" TEXT NOT NULL,
    "transactionHash" TEXT,
    "blockNumber" BIGINT,
    "chainId" INTEGER,
    "actorWallet" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_anchors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "fuel_batches_batchCode_key" ON "public"."fuel_batches"("batchCode");

-- CreateIndex
CREATE INDEX "fuel_batches_status_idx" ON "public"."fuel_batches"("status");

-- CreateIndex
CREATE INDEX "fuel_batches_riskLevel_idx" ON "public"."fuel_batches"("riskLevel");

-- CreateIndex
CREATE INDEX "fuel_batches_product_idx" ON "public"."fuel_batches"("product");

-- CreateIndex
CREATE INDEX "fuel_batches_originCountry_idx" ON "public"."fuel_batches"("originCountry");

-- CreateIndex
CREATE INDEX "fuel_batches_createdAt_idx" ON "public"."fuel_batches"("createdAt");

-- CreateIndex
CREATE INDEX "import_authorizations_batchId_idx" ON "public"."import_authorizations"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_identifier_key" ON "public"."vehicles"("identifier");

-- CreateIndex
CREATE INDEX "transports_batchId_idx" ON "public"."transports"("batchId");

-- CreateIndex
CREATE INDEX "customs_events_batchId_idx" ON "public"."customs_events"("batchId");

-- CreateIndex
CREATE INDEX "custody_events_batchId_timestamp_idx" ON "public"."custody_events"("batchId", "timestamp");

-- CreateIndex
CREATE INDEX "custody_events_eventType_idx" ON "public"."custody_events"("eventType");

-- CreateIndex
CREATE INDEX "documents_batchId_idx" ON "public"."documents"("batchId");

-- CreateIndex
CREATE INDEX "documents_sha256Hash_idx" ON "public"."documents"("sha256Hash");

-- CreateIndex
CREATE INDEX "quality_certificates_batchId_idx" ON "public"."quality_certificates"("batchId");

-- CreateIndex
CREATE INDEX "sampling_events_batchId_idx" ON "public"."sampling_events"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "sampling_events_sampleCode_key" ON "public"."sampling_events"("sampleCode");

-- CreateIndex
CREATE INDEX "lab_analyses_batchId_idx" ON "public"."lab_analyses"("batchId");

-- CreateIndex
CREATE INDEX "lab_analyses_sampleId_idx" ON "public"."lab_analyses"("sampleId");

-- CreateIndex
CREATE INDEX "measurements_batchId_idx" ON "public"."measurements"("batchId");

-- CreateIndex
CREATE INDEX "measurements_tankId_timestamp_idx" ON "public"."measurements"("tankId", "timestamp");

-- CreateIndex
CREATE INDEX "measurements_deviceId_idx" ON "public"."measurements"("deviceId");

-- CreateIndex
CREATE INDEX "anomalies_batchId_idx" ON "public"."anomalies"("batchId");

-- CreateIndex
CREATE INDEX "anomalies_status_idx" ON "public"."anomalies"("status");

-- CreateIndex
CREATE INDEX "anomalies_severity_idx" ON "public"."anomalies"("severity");

-- CreateIndex
CREATE INDEX "audit_cases_batchId_idx" ON "public"."audit_cases"("batchId");

-- CreateIndex
CREATE INDEX "audit_cases_status_idx" ON "public"."audit_cases"("status");

-- CreateIndex
CREATE INDEX "audit_notes_auditCaseId_idx" ON "public"."audit_notes"("auditCaseId");

-- CreateIndex
CREATE INDEX "blockchain_anchors_batchId_idx" ON "public"."blockchain_anchors"("batchId");

-- CreateIndex
CREATE INDEX "blockchain_anchors_transactionHash_idx" ON "public"."blockchain_anchors"("transactionHash");

-- CreateIndex
CREATE INDEX "blockchain_anchors_dataHash_idx" ON "public"."blockchain_anchors"("dataHash");

-- AddForeignKey
ALTER TABLE "public"."import_authorizations" ADD CONSTRAINT "import_authorizations_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."import_authorizations" ADD CONSTRAINT "import_authorizations_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transports" ADD CONSTRAINT "transports_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transports" ADD CONSTRAINT "transports_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customs_events" ADD CONSTRAINT "customs_events_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customs_events" ADD CONSTRAINT "customs_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customs_events" ADD CONSTRAINT "customs_events_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custody_events" ADD CONSTRAINT "custody_events_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custody_events" ADD CONSTRAINT "custody_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quality_certificates" ADD CONSTRAINT "quality_certificates_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quality_certificates" ADD CONSTRAINT "quality_certificates_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sampling_events" ADD CONSTRAINT "sampling_events_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_analyses" ADD CONSTRAINT "lab_analyses_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lab_analyses" ADD CONSTRAINT "lab_analyses_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "public"."sampling_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."measurements" ADD CONSTRAINT "measurements_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."fuel_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."measurements" ADD CONSTRAINT "measurements_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "public"."storage_tanks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."anomalies" ADD CONSTRAINT "anomalies_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_cases" ADD CONSTRAINT "audit_cases_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_cases" ADD CONSTRAINT "audit_cases_anomalyId_fkey" FOREIGN KEY ("anomalyId") REFERENCES "public"."anomalies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_cases" ADD CONSTRAINT "audit_cases_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_notes" ADD CONSTRAINT "audit_notes_auditCaseId_fkey" FOREIGN KEY ("auditCaseId") REFERENCES "public"."audit_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_notes" ADD CONSTRAINT "audit_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blockchain_anchors" ADD CONSTRAINT "blockchain_anchors_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

