import "dotenv/config"
import { createGmailSyncWorker, registerDailySyncScheduler } from "./gmail-sync"
import { createInvoiceExtractWorker } from "./invoice-extract"
import { createMatchingWorker } from "./matching"
import { createAnomalyWorker } from "./anomaly"
import { captureServerException, shutdownPostHog, log } from "@/lib/posthog-server"

const workers = [
  createGmailSyncWorker(),
  createInvoiceExtractWorker(),
  createMatchingWorker(),
  createAnomalyWorker(),
]

log.info(`✓ ${workers.length} workers started`)

registerDailySyncScheduler()
  .then(() => log.info("✓ daily Gmail sync scheduled (06:00 Asia/Jerusalem)"))
  .catch((err) => log.error("Failed to register daily sync scheduler", { error: err.message }))

for (const worker of workers) {
  worker.on("completed", (job) => {
    log.info(`[${job.queueName}] job ${job.id} completed`, { queue: job.queueName, jobId: job.id })
  })
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
      jobData: job?.data,
      attemptsMade: job?.attemptsMade,
    })
  })
}

// Graceful shutdown
async function shutdown() {
  log.info("Shutting down workers...")
  await Promise.all(workers.map((w) => w.close()))
  await shutdownPostHog()
  process.exit(0)
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
