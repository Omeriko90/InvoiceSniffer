-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('TAX_INVOICE', 'RECEIPT', 'CREDIT_INVOICE', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "allocationNumber" TEXT,
ADD COLUMN     "documentType" "DocumentType" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "vendorTaxId" TEXT;
