-- Transaction dedupe key: nullable so pre-existing rows stay NULL (Postgres
-- allows many NULLs under a unique index); new imports set a natural-key hash so
-- re-uploaded statements dedupe instead of doubling transactions.
ALTER TABLE "Transaction" ADD COLUMN "dedupeKey" TEXT;
CREATE UNIQUE INDEX "Transaction_organizationId_dedupeKey_key" ON "Transaction"("organizationId", "dedupeKey");

-- Hot-path indexes for the sync/matching queries flagged in the architecture review.
CREATE INDEX "Invoice_organizationId_status_idx" ON "Invoice"("organizationId", "status");
CREATE INDEX "VendorAlias_organizationId_type_active_idx" ON "VendorAlias"("organizationId", "type", "active");
