-- DEMO auth: password hashes for seeded actors
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
