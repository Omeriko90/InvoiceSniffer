-- CreateEnum
CREATE TYPE "RemovalReason" AS ENUM ('NOT_RELEVANT', 'NOT_AN_INVOICE');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "removalReason" "RemovalReason",
ADD COLUMN     "removedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Invoice_organizationId_removedAt_idx" ON "Invoice"("organizationId", "removedAt");

-- Backfill: existing IGNORED invoices were already "removed" in the user's mind
-- (marked "not an invoice" under the old behaviour). Hide them from the list and
-- label them as false positives. Leave their status untouched.
UPDATE "Invoice"
SET "removedAt" = CURRENT_TIMESTAMP, "removalReason" = 'NOT_AN_INVOICE'
WHERE "status" = 'IGNORED' AND "removedAt" IS NULL;
