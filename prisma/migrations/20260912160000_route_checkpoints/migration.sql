-- Route checkpoints: cantidad + calidad proxy + ubicación por tramo DEMO
CREATE TYPE "CheckpointKind" AS ENUM ('LOAD_DEPARTURE', 'ROUTE_WAYPOINT', 'ARRIVAL_STATION');

CREATE TABLE "route_checkpoints" (
    "id" TEXT NOT NULL,
    "kind" "CheckpointKind" NOT NULL,
    "label" TEXT,
    "deliveryId" TEXT,
    "cisternId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "actorId" TEXT,
    "volumeLiters" DECIMAL(18,3) NOT NULL,
    "density" DECIMAL(10,4),
    "temperature" DECIMAL(8,2),
    "waterDetected" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracyMeters" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientEventId" TEXT,
    "note" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_checkpoints_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "route_checkpoints_clientEventId_key" ON "route_checkpoints"("clientEventId");
CREATE INDEX "route_checkpoints_cisternId_capturedAt_idx" ON "route_checkpoints"("cisternId", "capturedAt");
CREATE INDEX "route_checkpoints_deliveryId_capturedAt_idx" ON "route_checkpoints"("deliveryId", "capturedAt");
CREATE INDEX "route_checkpoints_batchId_capturedAt_idx" ON "route_checkpoints"("batchId", "capturedAt");

ALTER TABLE "route_checkpoints" ADD CONSTRAINT "route_checkpoints_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "route_checkpoints" ADD CONSTRAINT "route_checkpoints_cisternId_fkey" FOREIGN KEY ("cisternId") REFERENCES "cisterns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "route_checkpoints" ADD CONSTRAINT "route_checkpoints_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "fuel_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "route_checkpoints" ADD CONSTRAINT "route_checkpoints_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
