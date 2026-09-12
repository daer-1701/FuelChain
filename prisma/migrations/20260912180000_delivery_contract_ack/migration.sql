-- Acuse DEMO de contrato de entrega (estación ↔ chofer)
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "stationContractAckAt" TIMESTAMP(3);
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "driverContractAckAt" TIMESTAMP(3);
