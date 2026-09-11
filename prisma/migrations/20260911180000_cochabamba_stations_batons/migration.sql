-- FuelChain Cochabamba: stations, batons, offline sync, measurement quality fields

CREATE TYPE "StationAvailability" AS ENUM ('FULL', 'MEDIUM', 'LOW', 'EMPTY', 'UNKNOWN');
CREATE TYPE "BatonStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'EXPIRED', 'REVOKED');
CREATE TYPE "OfflineSyncStatus" AS ENUM ('PENDING', 'APPLIED', 'REJECTED');

CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Cochabamba',
    "municipality" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "publicVisible" BOOLEAN NOT NULL DEFAULT true,
    "availability" "StationAvailability" NOT NULL DEFAULT 'UNKNOWN',
    "products" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastInventoryAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stations_code_key" ON "stations"("code");
CREATE INDEX "stations_city_publicVisible_idx" ON "stations"("city", "publicVisible");
CREATE INDEX "stations_availability_idx" ON "stations"("availability");

ALTER TABLE "storage_tanks" ADD COLUMN "stationId" TEXT;
ALTER TABLE "storage_tanks" ADD COLUMN "cisternCode" TEXT;
CREATE INDEX "storage_tanks_stationId_idx" ON "storage_tanks"("stationId");
CREATE INDEX "storage_tanks_cisternCode_idx" ON "storage_tanks"("cisternCode");
ALTER TABLE "storage_tanks" ADD CONSTRAINT "storage_tanks_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "measurements" ADD COLUMN "density" DECIMAL(10,4);
ALTER TABLE "measurements" ADD COLUMN "waterDetected" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "custody_batons" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "stationId" TEXT,
    "cisternCode" TEXT,
    "eventType" TEXT NOT NULL,
    "volumeLiters" DECIMAL(18,3) NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "previousHash" TEXT,
    "signature" TEXT NOT NULL,
    "status" "BatonStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedByRole" TEXT NOT NULL,
    "consumedByRole" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custody_batons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "custody_batons_tokenId_key" ON "custody_batons"("tokenId");
CREATE INDEX "custody_batons_batchId_status_idx" ON "custody_batons"("batchId", "status");
CREATE INDEX "custody_batons_tokenId_idx" ON "custody_batons"("tokenId");
ALTER TABLE "custody_batons" ADD CONSTRAINT "custody_batons_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "custody_batons" ADD CONSTRAINT "custody_batons_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "offline_sync_events" (
    "id" TEXT NOT NULL,
    "clientEventId" TEXT NOT NULL,
    "batonTokenId" TEXT,
    "batchId" TEXT,
    "stationId" TEXT,
    "actorRole" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OfflineSyncStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offline_sync_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "offline_sync_events_clientEventId_key" ON "offline_sync_events"("clientEventId");
CREATE INDEX "offline_sync_events_status_syncedAt_idx" ON "offline_sync_events"("status", "syncedAt");
CREATE INDEX "offline_sync_events_batchId_idx" ON "offline_sync_events"("batchId");
