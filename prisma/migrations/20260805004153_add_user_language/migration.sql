-- Add per-user UI language preference (defaults to English).
ALTER TABLE "User" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
