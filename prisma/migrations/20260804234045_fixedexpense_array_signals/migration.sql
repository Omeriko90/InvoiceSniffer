-- FixedExpense match signals become arrays so one expense can absorb invoices
-- from several vendor titles / senders. In-place casts preserve existing single
-- values (NULL -> empty array, value -> one-element array).

-- Drop the btree index before retyping the column (btree can't index arrays).
DROP INDEX "FixedExpense_organizationId_vendorNormalized_idx";

-- vendorName
ALTER TABLE "FixedExpense" ALTER COLUMN "vendorName" DROP DEFAULT;
ALTER TABLE "FixedExpense" ALTER COLUMN "vendorName" TYPE TEXT[]
  USING (CASE WHEN "vendorName" IS NULL THEN '{}'::TEXT[] ELSE ARRAY["vendorName"] END);
ALTER TABLE "FixedExpense" ALTER COLUMN "vendorName" SET DEFAULT '{}';
ALTER TABLE "FixedExpense" ALTER COLUMN "vendorName" SET NOT NULL;

-- vendorNormalized
ALTER TABLE "FixedExpense" ALTER COLUMN "vendorNormalized" DROP DEFAULT;
ALTER TABLE "FixedExpense" ALTER COLUMN "vendorNormalized" TYPE TEXT[]
  USING (CASE WHEN "vendorNormalized" IS NULL THEN '{}'::TEXT[] ELSE ARRAY["vendorNormalized"] END);
ALTER TABLE "FixedExpense" ALTER COLUMN "vendorNormalized" SET DEFAULT '{}';
ALTER TABLE "FixedExpense" ALTER COLUMN "vendorNormalized" SET NOT NULL;

-- senderEmail
ALTER TABLE "FixedExpense" ALTER COLUMN "senderEmail" DROP DEFAULT;
ALTER TABLE "FixedExpense" ALTER COLUMN "senderEmail" TYPE TEXT[]
  USING (CASE WHEN "senderEmail" IS NULL THEN '{}'::TEXT[] ELSE ARRAY["senderEmail"] END);
ALTER TABLE "FixedExpense" ALTER COLUMN "senderEmail" SET DEFAULT '{}';
ALTER TABLE "FixedExpense" ALTER COLUMN "senderEmail" SET NOT NULL;

-- GIN index for array containment on the primary match signal.
CREATE INDEX "FixedExpense_vendorNormalized_idx" ON "FixedExpense" USING GIN ("vendorNormalized");
