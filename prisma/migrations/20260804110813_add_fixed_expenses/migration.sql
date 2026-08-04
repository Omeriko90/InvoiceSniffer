-- CreateEnum
CREATE TYPE "FixedExpenseFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "FixedExpenseStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "fixedExpenseId" TEXT;

-- CreateTable
CREATE TABLE "FixedExpense" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "InvoiceCategory" NOT NULL DEFAULT 'UNCATEGORIZED',
    "vendorName" TEXT,
    "vendorNormalized" TEXT,
    "senderEmail" TEXT,
    "gmailCredentialId" TEXT,
    "expectedAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "frequency" "FixedExpenseFrequency" NOT NULL DEFAULT 'MONTHLY',
    "anchorDate" TIMESTAMP(3) NOT NULL,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 5,
    "status" "FixedExpenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FixedExpense_organizationId_status_idx" ON "FixedExpense"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FixedExpense_organizationId_vendorNormalized_idx" ON "FixedExpense"("organizationId", "vendorNormalized");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_fixedExpenseId_idx" ON "Invoice"("organizationId", "fixedExpenseId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_fixedExpenseId_fkey" FOREIGN KEY ("fixedExpenseId") REFERENCES "FixedExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedExpense" ADD CONSTRAINT "FixedExpense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
