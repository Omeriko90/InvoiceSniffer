import "dotenv/config"
import type { Worker } from "bullmq"
import { createGmailSyncWorker } from "./gmail-sync"
import { createInvoiceExtractWorker } from "./invoice-extract"
import { gmailSyncQueue, extractionQueue } from "@/lib/queues"
import { prisma } from "@/lib/prisma"
import { captureServerException, shutdownPostHog, log } from "@/lib/posthog-server"

// One-shot batch runner for the Cloud Run Job: boot the workers, drain the
// queue chain to idle, then exit. Unlike src/workers/index.ts (always-on, used
// for local dev), this process is meant to start, do all pending work, and die.
//
//   MODE=daily  → enqueue the fan-out job, then drain (Cloud Scheduler path)
//   MODE=drain  → drain whatever the web tier already enqueued (on-demand path)

const SYNC_ALL_JOB = "gmail:sync-all"
const POLL_INTERVAL_MS = 2000
const REQUIRED_IDLE_POLLS = 3 // consecutive idle polls before we trust "done"
const MAX_RUNTIME_MS = 25 * 60 * 1000

// Only the queues that have a consumer in this run. gmail-sync enqueues
// extraction jobs *while its own job is still active*, so a combined
// waiting+active+delayed==0 across both queues can only be true after the whole
// chain has settled — that's what makes the drain safe. (The `anomaly`/`exports`
// queues have no consumer today and are intentionally excluded.)
const queues = [gmailSyncQueue(), extractionQueue()]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function allIdle(): Promise<boolean> {
  for (const q of queues) {
    const c = await q.getJobCounts("waiting", "active", "delayed")
    if ((c.waiting ?? 0) + (c.active ?? 0) + (c.delayed ?? 0) > 0) return false
  }
  return true
}

async function cleanup(workers: Worker[], code: number): Promise<never> {
  await Promise.all(workers.map((w) => w.close()))
  await prisma.$disconnect()
  await shutdownPostHog()
  process.exit(code)
}

async function main() {
  const mode = process.env.MODE ?? "drain"
  log.info(`batch worker starting (MODE=${mode})`)

  // Export builds are DB-driven (no BullMQ): the QUEUED ExportJob rows are the
  // work list. Skip booting the queue workers and the Redis drain loop entirely.
  if (mode === "export") {
    const { processPendingExports } = await import("./export-build")
    const count = await processPendingExports()
    log.info(`processed ${count} export job(s); shutting down`)
    await prisma.$disconnect()
    await shutdownPostHog()
    process.exit(0)
  }

  const workers = [createGmailSyncWorker(), createInvoiceExtractWorker()]

  for (const worker of workers) {
    worker.on("failed", (job, err) => {
      log.error(`[${job?.queueName}] job ${job?.id} failed: ${err.message}`, {
        queue: job?.queueName,
        jobId: job?.id,
        jobName: job?.name,
      })
      captureServerException(err, `worker:${worker.name}`, {
        queue: job?.queueName,
        jobId: job?.id,
        jobName: job?.name,
        attemptsMade: job?.attemptsMade,
      })
    })
  }

  if (mode === "daily") {
    // Reuse the existing fan-out: the gmail-sync handler turns this single job
    // into one sync per connected mailbox (enqueueSyncForAllCredentials is not
    // exported, by design). The dummy payload is ignored by the SYNC_ALL branch.
    // No fixed jobId — a retained completed job would otherwise block re-runs.
    await gmailSyncQueue().add(SYNC_ALL_JOB, { organizationId: "", mode: "full" })
  }

  const deadline = Date.now() + MAX_RUNTIME_MS
  let consecutiveIdle = 0

  while (consecutiveIdle < REQUIRED_IDLE_POLLS) {
    if (Date.now() > deadline) {
      const err = new Error(`batch worker timed out after ${MAX_RUNTIME_MS}ms with work still pending`)
      log.error(err.message)
      captureServerException(err, "worker:batch")
      await cleanup(workers, 1) // non-zero: surface the timeout in Cloud Run
    }
    await sleep(POLL_INTERVAL_MS)
    consecutiveIdle = (await allIdle()) ? consecutiveIdle + 1 : 0
  }

  log.info("queues drained; shutting down")
  await cleanup(workers, 0)
}

main().catch(async (err) => {
  log.error("batch worker crashed", { error: err instanceof Error ? err.message : String(err) })
  captureServerException(err, "worker:batch")
  await shutdownPostHog()
  process.exit(1)
})
