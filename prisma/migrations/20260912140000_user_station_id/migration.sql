-- Assign STATION_STAFF operators to a single EESS (DEMO).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stationId" TEXT;

CREATE INDEX IF NOT EXISTS "users_stationId_idx" ON "users"("stationId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_stationId_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_stationId_fkey"
      FOREIGN KEY ("stationId") REFERENCES "stations"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
