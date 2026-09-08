-- CreateEnum
CREATE TYPE "InvoiceSource" AS ENUM ('GMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "WhatsAppInboundStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "r2Key" TEXT,
ADD COLUMN     "source" "InvoiceSource" NOT NULL DEFAULT 'GMAIL',
ADD COLUMN     "whatsappFromPhone" TEXT,
ADD COLUMN     "whatsappMessageId" TEXT,
ALTER COLUMN "gmailMessageId" DROP NOT NULL,
ALTER COLUMN "gmailThreadId" DROP NOT NULL,
ALTER COLUMN "gmailLink" DROP NOT NULL,
ALTER COLUMN "senderEmail" DROP NOT NULL,
ALTER COLUMN "subject" DROP NOT NULL,
ALTER COLUMN "emailDate" DROP NOT NULL;

-- CreateTable
CREATE TABLE "WhatsAppNumber" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "label" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppInboundMessage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whatsappMessageId" TEXT NOT NULL,
    "fromPhoneE164" TEXT NOT NULL,
    "r2Key" TEXT,
    "mimeType" TEXT,
    "caption" TEXT,
    "status" "WhatsAppInboundStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppInboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppNumber_phoneE164_key" ON "WhatsAppNumber"("phoneE164");

-- CreateIndex
CREATE INDEX "WhatsAppNumber_organizationId_idx" ON "WhatsAppNumber"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppInboundMessage_whatsappMessageId_key" ON "WhatsAppInboundMessage"("whatsappMessageId");

-- CreateIndex
CREATE INDEX "WhatsAppInboundMessage_status_createdAt_idx" ON "WhatsAppInboundMessage"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppInboundMessage_organizationId_idx" ON "WhatsAppInboundMessage"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_organizationId_whatsappMessageId_key" ON "Invoice"("organizationId", "whatsappMessageId");

-- AddForeignKey
ALTER TABLE "WhatsAppNumber" ADD CONSTRAINT "WhatsAppNumber_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppInboundMessage" ADD CONSTRAINT "WhatsAppInboundMessage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

