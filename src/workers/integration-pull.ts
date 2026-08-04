import { Worker, Job } from "bullmq"
import { prisma } from "@/lib/prisma"
import {
  integrationPullQueue,
  redisUrl,
  type IntegrationPullJobData,
} from "@/lib/queues"
import { getConnector, connectorImplemented } from "@/lib/integrations/registry"
import { ingestNormalizedInvoice } from "@/lib/integrations/ingest"
import { directionAllowsPull } from "@/lib/integrations/types"
import { log } from "@/lib/posthog-server"

// Daily fan-out job name — enqueues an incremental pull for every connected
// integration that can (and is configured to) pull.
const PULL_ALL_JOB = "integration:pull-all"

// Safety cap so a broken/looping cursor can't pull forever in one run.
const MAX_PAGES = 50

export function createIntegrationPullWorker() {
  return new Worker<IntegrationPullJobData>(
    "integration-pull",
    async (job: Job<IntegrationPullJobData>) => {
      if (job.name === PULL_ALL_JOB) {
        return enqueuePullForAllCredentials()
      }

      const { organizationId, integrationCredentialId, mode } = job.data

      // Trust boundary: the queue payload is not authoritative. Derive the org
      // from the credential and refuse on mismatch, so a mis-enqueued job can't
      // write one org's expenses under another (cross-tenant leak).
      const cred = await prisma.integrationCredential.findUnique({
        where: { id: integrationCredentialId },
      })
      if (!cred) {
        log.error("integration-pull: credential not found; skipping", { integrationCredentialId })
        return { skipped: "credential-not-found" }
      }
      if (cred.organizationId !== organizationId) {
        log.error("integration-pull: job organizationId does not match credential; refusing", {
          integrationCredentialId,
          jobOrganizationId: organizationId,
          credentialOrganizationId: cred.organizationId,
        })
        throw new Error("integration-pull: job organizationId does not match credential")
      }
      if (!cred.connected) return { skipped: "disconnected" }
      if (!directionAllowsPull(cred.direction)) return { skipped: "pull-not-enabled" }
      if (!connectorImplemented(cred.provider)) return { skipped: "connector-not-implemented" }

      const connector = getConnector(cred.provider)
      if (!connector.capabilities.canPull || !connector.pullInvoices) {
        return { skipped: "pull-unsupported" }
      }

      // Full sync restarts from the beginning; incremental resumes from the cursor.
      let cursor = mode === "full" ? null : cred.pullCursor
      let ingested = 0
      for (let page = 0; page < MAX_PAGES; page++) {
        const { items, nextCursor } = await connector.pullInvoices(cred, cursor)
        for (const doc of items) {
          await ingestNormalizedInvoice(cred, doc)
          ingested++
        }
        cursor = nextCursor
        // Persist the cursor after every page so a mid-run failure resumes
        // rather than re-pulling from scratch.
        await prisma.integrationCredential.update({
          where: { id: cred.id },
          data: { pullCursor: cursor, lastPulledAt: new Date() },
        })
        if (!nextCursor || items.length === 0) break
      }

      log.info("integration-pull: done", { provider: cred.provider, credentialId: cred.id, ingested })
      return { ingested }
    },
    { connection: { url: redisUrl() }, concurrency: 3 }
  )
}

// Idempotent — upsert keyed by scheduler id, safe to call on every startup.
// Runs daily an hour after the Gmail sync so both sources land before the user's
// morning review.
export async function registerIntegrationPullScheduler() {
  await integrationPullQueue().upsertJobScheduler(
    "daily-integration-pull",
    { pattern: "0 7 * * *", tz: "Asia/Jerusalem" },
    { name: PULL_ALL_JOB }
  )
}

async function enqueuePullForAllCredentials() {
  const creds = await prisma.integrationCredential.findMany({
    where: { connected: true },
    select: { id: true, organizationId: true, provider: true, direction: true },
  })
  let enqueued = 0
  for (const cred of creds) {
    if (!directionAllowsPull(cred.direction)) continue
    if (!connectorImplemented(cred.provider)) continue
    await integrationPullQueue().add("pull", {
      organizationId: cred.organizationId,
      integrationCredentialId: cred.id,
      mode: "incremental",
    })
    enqueued++
  }
  log.info("integration-pull: daily fan-out enqueued", { enqueued })
  return { enqueued }
}
