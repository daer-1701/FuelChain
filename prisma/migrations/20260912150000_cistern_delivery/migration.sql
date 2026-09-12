-- Citizen role + delivery/cistern domain

ALTER TYPE "ActorRole" ADD VALUE IF NOT EXISTS 'CITIZEN';

DO $$ BEGIN
  CREATE TYPE "DeliveryStatus" AS ENUM ('LOADED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CisternStatus" AS ENUM ('AVAILABLE', 'LOADED', 'IN_TRANSIT', 'OFFLINE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "fuel_batches" ADD COLUMN IF NOT EXISTS "deliveredLiters" DECIMAL(18,3) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "cisterns" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "plate" TEXT,
  "carrier" TEXT NOT NULL,
  "capacityLiters" DECIMAL(18,3) NOT NULL,
  "currentLoadLiters" DECIMAL(18,3) NOT NULL DEFAULT 0,
  "status" "CisternStatus" NOT NULL DEFAULT 'AVAILABLE',
  "driverId" TEXT,
  "currentBatchId" TEXT,
  "isDemo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cisterns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cisterns_code_key" ON "cisterns"("code");
CREATE INDEX IF NOT EXISTS "cisterns_driverId_idx" ON "cisterns"("driverId");
CREATE INDEX IF NOT EXISTS "cisterns_status_idx" ON "cisterns"("status");

CREATE TABLE IF NOT EXISTS "deliveries" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "cisternId" TEXT NOT NULL,
  "destinationStationId" TEXT NOT NULL,
  "status" "DeliveryStatus" NOT NULL DEFAULT 'LOADED',
  "loadedLiters" DECIMAL(18,3) NOT NULL,
  "receivedLiters" DECIMAL(18,3),
  "loadDensity" DECIMAL(10,4),
  "loadTemperature" DECIMAL(8,2),
  "loadWaterDetected" BOOLEAN NOT NULL DEFAULT false,
  "loadCertificateStatus" TEXT,
  "receivedDensity" DECIMAL(10,4),
  "receivedTemperature" DECIMAL(8,2),
  "receivedWaterDetected" BOOLEAN NOT NULL DEFAULT false,
  "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt" TIMESTAMP(3),
  "batonTokenId" TEXT,
  "isDemo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "deliveries_batchId_status_idx" ON "deliveries"("batchId", "status");
CREATE INDEX IF NOT EXISTS "deliveries_cisternId_status_idx" ON "deliveries"("cisternId", "status");
CREATE INDEX IF NOT EXISTS "deliveries_destinationStationId_idx" ON "deliveries"("destinationStationId");

ALTER TABLE "custody_batons" ADD COLUMN IF NOT EXISTS "cisternId" TEXT;
ALTER TABLE "custody_batons" ADD COLUMN IF NOT EXISTS "deliveryId" TEXT;

CREATE INDEX IF NOT EXISTS "custody_batons_deliveryId_idx" ON "custody_batons"("deliveryId");

DO $$ BEGIN
  ALTER TABLE "cisterns" ADD CONSTRAINT "cisterns_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "cisterns" ADD CONSTRAINT "cisterns_currentBatchId_fkey"
    FOREIGN KEY ("currentBatchId") REFERENCES "fuel_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_cisternId_fkey"
    FOREIGN KEY ("cisternId") REFERENCES "cisterns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_destinationStationId_fkey"
    FOREIGN KEY ("destinationStationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "custody_batons" ADD CONSTRAINT "custody_batons_cisternId_fkey"
    FOREIGN KEY ("cisternId") REFERENCES "cisterns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "custody_batons" ADD CONSTRAINT "custody_batons_deliveryId_fkey"
    FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
