-- CreateEnum
CREATE TYPE "InvoiceCategory" AS ENUM ('MARKETING', 'EQUIPMENT', 'SOFTWARE', 'TRAVEL', 'OFFICE_SUPPLIES', 'PROFESSIONAL_SERVICES', 'UTILITIES', 'OTHER', 'UNCATEGORIZED');

-- AlterTable
-- Existing rows backfill to UNCATEGORIZED via the column default.
ALTER TABLE "Invoice" ADD COLUMN     "category" "InvoiceCategory" NOT NULL DEFAULT 'UNCATEGORIZED';

-- CreateIndex
CREATE INDEX "Invoice_organizationId_category_emailDate_idx" ON "Invoice"("organizationId", "category", "emailDate");
