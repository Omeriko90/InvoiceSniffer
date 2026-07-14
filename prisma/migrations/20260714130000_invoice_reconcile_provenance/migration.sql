-- Reconcile provenance on Invoice: which CSV a match was confirmed against and
-- when. Nullable — set on confirm/link in an ephemeral reconcile session,
-- cleared on undo. Powers the "reconciled against <file>" breadcrumb and
-- collision warnings when a later session re-matches an already-reconciled invoice.
ALTER TABLE "Invoice" ADD COLUMN "reconciledSourceFile" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "reconciledAt" TIMESTAMP(3);
