-- CreateTable
CREATE TABLE "ClassificationBatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'gemini-batch',
    "resourceName" TEXT,
    "model" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'QUEUED',
    "itemCount" INTEGER NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ClassificationBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingClassification" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "requestIndex" INTEGER NOT NULL,
    "heuristicIsCandidate" BOOLEAN NOT NULL,
    "rawIsCandidate" BOOLEAN NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "hadPenalty" BOOLEAN NOT NULL,

    CONSTRAINT "PendingClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassificationBatch_state_idx" ON "ClassificationBatch"("state");

-- CreateIndex
CREATE INDEX "ClassificationBatch_organizationId_createdAt_idx" ON "ClassificationBatch"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "PendingClassification_batchId_idx" ON "PendingClassification"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingClassification_credentialId_gmailMessageId_key" ON "PendingClassification"("credentialId", "gmailMessageId");

-- AddForeignKey
ALTER TABLE "ClassificationBatch" ADD CONSTRAINT "ClassificationBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingClassification" ADD CONSTRAINT "PendingClassification_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ClassificationBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
