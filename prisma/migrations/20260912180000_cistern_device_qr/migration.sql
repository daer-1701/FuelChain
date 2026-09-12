-- QR permanente en cisterna + deviceId del gateway/logger

ALTER TABLE "cisterns" ADD COLUMN "qrToken" TEXT;
ALTER TABLE "cisterns" ADD COLUMN "deviceId" TEXT;

UPDATE "cisterns"
SET
  "qrToken" = 'CQ-' || UPPER(REPLACE("code", 'CIS-', '')),
  "deviceId" = 'GW-' || "code"
WHERE "qrToken" IS NULL OR "deviceId" IS NULL;

ALTER TABLE "cisterns" ALTER COLUMN "qrToken" SET NOT NULL;
ALTER TABLE "cisterns" ALTER COLUMN "deviceId" SET NOT NULL;

CREATE UNIQUE INDEX "cisterns_qrToken_key" ON "cisterns"("qrToken");
CREATE UNIQUE INDEX "cisterns_deviceId_key" ON "cisterns"("deviceId");
CREATE INDEX "cisterns_deviceId_idx" ON "cisterns"("deviceId");
