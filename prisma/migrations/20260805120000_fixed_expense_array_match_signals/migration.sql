-- Convert FixedExpense match signals from scalar to array (array-aware matching).
-- Existing non-null scalars become single-element arrays; nulls become empty arrays.
--
-- IDEMPOTENT GUARD: 20260804234045_fixedexpense_array_signals already performs this
-- exact scalar->array conversion. Both migrations ship together, so on a fresh
-- database this one runs right after 234045 -- by which point the columns are ALREADY
-- text[]. Re-wrapping an array with ARRAY[...] yields a 2-D array ({{x}} instead of
-- {x}), which Prisma 7 refuses to deserialize (P2023, "expected a string ... got
-- object"), 500-ing every page that reads FixedExpense. So only convert while the
-- column is still scalar; once it is already an array this migration is a no-op.

-- The old scalar composite index is invalid on an array column and nothing queries
-- FixedExpense by vendorNormalized. IF EXISTS: absent in some environments.
DROP INDEX IF EXISTS "FixedExpense_organizationId_vendorNormalized_idx";

DO $$
BEGIN
  -- vendorName / vendorNormalized / senderEmail are always converted together, so a
  -- single probe on vendorName is enough to know whether the conversion already ran.
  IF (SELECT data_type
        FROM information_schema.columns
       WHERE table_name = 'FixedExpense' AND column_name = 'vendorName') = 'ARRAY' THEN
    RAISE NOTICE 'FixedExpense match signals already array; skipping conversion';
  ELSE
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
  END IF;
END $$;
