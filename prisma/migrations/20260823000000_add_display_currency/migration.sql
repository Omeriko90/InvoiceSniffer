ALTER TABLE "Organization" ADD COLUMN     "displayCurrency" TEXT NOT NULL DEFAULT 'USD';

ALTER TABLE "Invoice" ADD COLUMN     "displayAmount" DECIMAL(12,2),
ADD COLUMN     "displayCurrency" TEXT,
ADD COLUMN     "fxRate" DECIMAL(18,8),
ADD COLUMN     "fxAsOf" TIMESTAMP(3);
