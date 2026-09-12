-- Liquidación DEMO al chofer tras entrega completada
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

CREATE TABLE IF NOT EXISTS "driver_settlements" (
  "id" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "driverId" TEXT,
  "cisternId" TEXT NOT NULL,
  "stationId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "liters" DECIMAL(18,3) NOT NULL,
  "ratePerLiter" DECIMAL(12,4) NOT NULL,
  "amountBob" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BOB',
  "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  "paidById" TEXT,
  "evidenceNote" TEXT,
  "isDemo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "driver_settlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "driver_settlements_deliveryId_key" ON "driver_settlements"("deliveryId");
CREATE INDEX IF NOT EXISTS "driver_settlements_driverId_status_idx" ON "driver_settlements"("driverId", "status");
CREATE INDEX IF NOT EXISTS "driver_settlements_stationId_status_idx" ON "driver_settlements"("stationId", "status");
CREATE INDEX IF NOT EXISTS "driver_settlements_status_createdAt_idx" ON "driver_settlements"("status", "createdAt");

ALTER TABLE "driver_settlements" ADD CONSTRAINT "driver_settlements_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "driver_settlements" ADD CONSTRAINT "driver_settlements_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "driver_settlements" ADD CONSTRAINT "driver_settlements_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "driver_settlements" ADD CONSTRAINT "driver_settlements_cisternId_fkey" FOREIGN KEY ("cisternId") REFERENCES "cisterns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "driver_settlements" ADD CONSTRAINT "driver_settlements_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "driver_settlements" ADD CONSTRAINT "driver_settlements_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
