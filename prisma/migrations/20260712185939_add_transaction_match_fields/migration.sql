-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'IGNORED';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "matchConfidence" DOUBLE PRECISION,
ADD COLUMN     "matchConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchReason" TEXT;
