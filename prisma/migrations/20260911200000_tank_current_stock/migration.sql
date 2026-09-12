-- Persist tank inventory so QR reception is a delta, not a fill ratio.
ALTER TABLE "storage_tanks" ADD COLUMN "currentStockLiters" DECIMAL(18,3) NOT NULL DEFAULT 0;
