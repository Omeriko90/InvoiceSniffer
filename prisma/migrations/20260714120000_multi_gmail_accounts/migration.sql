-- Multi-account Gmail support: GmailCredential becomes 1:N per org and owns the
-- sync state that previously lived on Organization; Invoice gains a source-mailbox FK.

-- 1. GmailCredential: add new columns (nullable / defaulted so the add is safe)
ALTER TABLE "GmailCredential" ADD COLUMN     "label" TEXT;
ALTER TABLE "GmailCredential" ADD COLUMN     "connected" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "GmailCredential" ADD COLUMN     "syncToken" TEXT;
ALTER TABLE "GmailCredential" ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);

-- 2. Backfill sync state from Organization (each org has 0-1 credential today,
--    so this is a clean 1:1 join). Guarded so a re-run is a no-op.
UPDATE "GmailCredential" gc
SET "syncToken"    = o."gmailSyncToken",
    "lastSyncedAt" = o."lastSyncedAt",
    "connected"    = o."gmailConnected"
FROM "Organization" o
WHERE gc."organizationId" = o."id";

-- 3. Swap the uniqueness: drop the org-only unique, add (organizationId, email)
DROP INDEX "GmailCredential_organizationId_key";
CREATE UNIQUE INDEX "GmailCredential_organizationId_email_key" ON "GmailCredential"("organizationId", "email");

-- 4. Invoice: add the source-mailbox FK column (nullable)
ALTER TABLE "Invoice" ADD COLUMN     "gmailCredentialId" TEXT;

-- 5. Backfill attribution: every existing invoice came from its org's single credential.
--    Orphans (org whose credential was already gone) stay NULL, which SetNull tolerates.
UPDATE "Invoice" i
SET "gmailCredentialId" = gc."id"
FROM "GmailCredential" gc
WHERE gc."organizationId" = i."organizationId"
  AND i."gmailCredentialId" IS NULL;

-- 6. Index + FK on Invoice.gmailCredentialId
CREATE INDEX "Invoice_gmailCredentialId_idx" ON "Invoice"("gmailCredentialId");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_gmailCredentialId_fkey" FOREIGN KEY ("gmailCredentialId") REFERENCES "GmailCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Drop the org-level sync columns now that state lives on the credential
ALTER TABLE "Organization" DROP COLUMN "gmailConnected";
ALTER TABLE "Organization" DROP COLUMN "gmailSyncToken";
ALTER TABLE "Organization" DROP COLUMN "lastSyncedAt";
