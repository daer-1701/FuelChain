-- AlterEnum ActorRole for Cochabamba pilot roles
ALTER TYPE "ActorRole" ADD VALUE IF NOT EXISTS 'STATION_STAFF';
ALTER TYPE "ActorRole" ADD VALUE IF NOT EXISTS 'VERIFIER';
