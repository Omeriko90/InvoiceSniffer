-- Org-wide display currency + per-invoice converted amount (locked at arrival).
-- All additive: existing orgs default to USD; existing invoices keep null
-- converted fields and fall back to their original totalAmount/currency.

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "displayCurrency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "displayAmount" DECIMAL(12,2),
ADD COLUMN     "displayCurrency" TEXT,
ADD COLUMN     "fxRate" DECIMAL(18,8),
ADD COLUMN     "fxAsOf" TIMESTAMP(3);
