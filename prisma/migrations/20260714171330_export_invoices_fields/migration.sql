-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('CSV', 'XLSX', 'PDF');

-- AlterTable
ALTER TABLE "ExportJob" ADD COLUMN     "fields" TEXT[],
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "format" "ExportFormat" NOT NULL DEFAULT 'PDF',
ADD COLUMN     "invoiceIds" TEXT[],
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "skipped" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "skippedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ExportJob_organizationId_createdAt_idx" ON "ExportJob"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ExportJob_status_idx" ON "ExportJob"("status");
