-- Convert FixedExpense match signals from scalar to array (array-aware matching).
-- Existing non-null scalars become single-element arrays; nulls become empty arrays.

-- The scalar composite index is no longer valid on an array column and nothing
-- queries FixedExpense by vendorNormalized, so drop it.
DROP INDEX "FixedExpense_organizationId_vendorNormalized_idx";

ALTER TABLE "FixedExpense"
  ALTER COLUMN "vendorName" TYPE TEXT[]
    USING (CASE WHEN "vendorName" IS NULL THEN ARRAY[]::TEXT[] ELSE ARRAY["vendorName"] END),
  ALTER COLUMN "vendorName" SET NOT NULL,
  ALTER COLUMN "vendorName" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "FixedExpense"
  ALTER COLUMN "vendorNormalized" TYPE TEXT[]
    USING (CASE WHEN "vendorNormalized" IS NULL THEN ARRAY[]::TEXT[] ELSE ARRAY["vendorNormalized"] END),
  ALTER COLUMN "vendorNormalized" SET NOT NULL,
  ALTER COLUMN "vendorNormalized" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "FixedExpense"
  ALTER COLUMN "senderEmail" TYPE TEXT[]
    USING (CASE WHEN "senderEmail" IS NULL THEN ARRAY[]::TEXT[] ELSE ARRAY["senderEmail"] END),
  ALTER COLUMN "senderEmail" SET NOT NULL,
  ALTER COLUMN "senderEmail" SET DEFAULT ARRAY[]::TEXT[];
