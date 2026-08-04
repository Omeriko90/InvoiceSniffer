import { Worker, Job } from "bullmq"
import { prisma } from "@/lib/prisma"
import { redisUrl, type IntegrationPushJobData } from "@/lib/queues"
import { getConnector, connectorImplemented } from "@/lib/integrations/registry"
import { directionAllowsPush } from "@/lib/integrations/types"
import { log } from "@/lib/posthog-server"

// Push reconciled invoices out to an accounting platform as expense records.
// Idempotent via the InvoiceSync ledger: an invoice already SYNCED to this
// integration is skipped, so a re-run (retry, duplicate action) never
// double-creates on the provider.
export function createIntegrationPushWorker() {
  return new Worker<IntegrationPushJobData>(
    "integration-push",
    async (job: Job<IntegrationPushJobData>) => {
      const { organizationId, integrationCredentialId, invoiceIds } = job.data

      // Trust boundary: derive the org from the credential, refuse on mismatch.
      const cred = await prisma.integrationCredential.findUnique({
        where: { id: integrationCredentialId },
      })
      if (!cred) {
        log.error("integration-push: credential not found; skipping", { integrationCredentialId })
        return { skipped: "credential-not-found" }
      }
      if (cred.organizationId !== organizationId) {
        log.error("integration-push: job organizationId does not match credential; refusing", {
          integrationCredentialId,
        })
        throw new Error("integration-push: job organizationId does not match credential")
      }
      if (!cred.connected) return { skipped: "disconnected" }
      if (!directionAllowsPush(cred.direction)) return { skipped: "push-not-enabled" }
      if (!connectorImplemented(cred.provider)) return { skipped: "connector-not-implemented" }

      const connector = getConnector(cred.provider)
      if (!connector.capabilities.canPush || !connector.pushInvoice) {
        return { skipped: "push-unsupported" }
      }

      // Category mapping for this connection (our enum -> provider category id).
      const maps = await prisma.integrationCategoryMap.findMany({
        where: { integrationCredentialId: cred.id },
      })
      const categoryMap = new Map<string, string>(
        maps.map((m): [string, string] => [m.invoiceCategory, m.externalCategoryId])
      )

      let pushed = 0
      let skipped = 0
      let failed = 0
      for (const invoiceId of invoiceIds) {
        // Idempotency: skip anything already synced to this integration.
        const existing = await prisma.invoiceSync.findUnique({
          where: {
            invoiceId_integrationCredentialId: {
              invoiceId,
              integrationCredentialId: cred.id,
            },
          },
        })
        if (existing?.status === "SYNCED") {
          skipped++
          continue
        }

        const invoice = await prisma.invoice.findFirst({
          // Scope by org so a bad id can't push another tenant's invoice.
          where: { id: invoiceId, organizationId },
        })
        if (!invoice) {
          skipped++
          continue
        }

        try {
          const { externalId } = await connector.pushInvoice(
            cred,
            invoice,
            categoryMap.get(invoice.category)
          )
          await upsertSync(invoiceId, cred.id, { status: "SYNCED", externalId, syncedAt: new Date(), lastError: null })
          pushed++
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          await upsertSync(invoiceId, cred.id, { status: "FAILED", lastError: message })
          log.warn("integration-push: invoice push failed", {
            provider: cred.provider,
            invoiceId,
            error: message,
          })
          failed++
        }
      }

      log.info("integration-push: done", { provider: cred.provider, pushed, skipped, failed })
      return { pushed, skipped, failed }
    },
    { connection: { url: redisUrl() }, concurrency: 3 }
  )
}

async function upsertSync(
  invoiceId: string,
  integrationCredentialId: string,
  data: { status: string; externalId?: string; syncedAt?: Date; lastError?: string | null }
) {
  await prisma.invoiceSync.upsert({
    where: { invoiceId_integrationCredentialId: { invoiceId, integrationCredentialId } },
    create: { invoiceId, integrationCredentialId, ...data },
    update: data,
  })
}
