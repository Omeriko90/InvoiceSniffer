-- CreateEnum
CREATE TYPE "InvoiceSource" AS ENUM ('GMAIL', 'MORNING', 'XERO', 'ICOUNT', 'QUICKBOOKS', 'FRESHBOOKS', 'SUMIT', 'BIZIBOX', 'TAKZIVIT', 'PAPERLESS');

-- AlterEnum
ALTER TYPE "ExtractionMethod" ADD VALUE 'API';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalRef" TEXT,
ADD COLUMN     "integrationCredentialId" TEXT,
ADD COLUMN     "source" "InvoiceSource" NOT NULL DEFAULT 'GMAIL',
ALTER COLUMN "gmailMessageId" DROP NOT NULL,
ALTER COLUMN "gmailThreadId" DROP NOT NULL,
ALTER COLUMN "gmailLink" DROP NOT NULL;

-- Backfill provenance for existing (Gmail-sourced) rows so the cross-source
-- dedup key (organizationId, source, externalId) is populated for every row.
UPDATE "Invoice"
SET "source" = 'GMAIL',
    "externalId" = "gmailMessageId",
    "externalRef" = "gmailLink"
WHERE "externalId" IS NULL;

-- CreateTable
CREATE TABLE "IntegrationCredential" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "InvoiceSource" NOT NULL,
    "label" TEXT,
    "externalAccountId" TEXT,
    "authKind" TEXT NOT NULL,
    "secrets" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "connected" BOOLEAN NOT NULL DEFAULT true,
    "direction" TEXT NOT NULL DEFAULT 'BOTH',
    "pullCursor" TEXT,
    "lastPulledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceSync" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "integrationCredentialId" TEXT NOT NULL,
    "externalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationCategoryMap" (
    "id" TEXT NOT NULL,
    "integrationCredentialId" TEXT NOT NULL,
    "invoiceCategory" "InvoiceCategory" NOT NULL,
    "externalCategoryId" TEXT NOT NULL,

    CONSTRAINT "IntegrationCategoryMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegrationCredential_organizationId_idx" ON "IntegrationCredential"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCredential_organizationId_provider_externalAccou_key" ON "IntegrationCredential"("organizationId", "provider", "externalAccountId");

-- CreateIndex
CREATE INDEX "InvoiceSync_integrationCredentialId_status_idx" ON "InvoiceSync"("integrationCredentialId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceSync_invoiceId_integrationCredentialId_key" ON "InvoiceSync"("invoiceId", "integrationCredentialId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCategoryMap_integrationCredentialId_invoiceCateg_key" ON "IntegrationCategoryMap"("integrationCredentialId", "invoiceCategory");

-- CreateIndex
CREATE INDEX "Invoice_integrationCredentialId_idx" ON "Invoice"("integrationCredentialId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_organizationId_source_externalId_key" ON "Invoice"("organizationId", "source", "externalId");

-- AddForeignKey
ALTER TABLE "IntegrationCredential" ADD CONSTRAINT "IntegrationCredential_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSync" ADD CONSTRAINT "InvoiceSync_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSync" ADD CONSTRAINT "InvoiceSync_integrationCredentialId_fkey" FOREIGN KEY ("integrationCredentialId") REFERENCES "IntegrationCredential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCategoryMap" ADD CONSTRAINT "IntegrationCategoryMap_integrationCredentialId_fkey" FOREIGN KEY ("integrationCredentialId") REFERENCES "IntegrationCredential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_integrationCredentialId_fkey" FOREIGN KEY ("integrationCredentialId") REFERENCES "IntegrationCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE;
