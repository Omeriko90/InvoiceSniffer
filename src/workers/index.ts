import "dotenv/config"
import { createGmailSyncWorker, registerDailySyncScheduler } from "./gmail-sync"
import { createInvoiceExtractWorker } from "./invoice-extract"
import { captureServerException, shutdownPostHog } from "@/lib/posthog-server"

const workers = [
  createGmailSyncWorker(),
  createInvoiceExtractWorker(),
]

console.log(`✓ ${workers.length} workers started`)

registerDailySyncScheduler()
  .then(() => console.log("✓ daily Gmail sync scheduled (06:00 Asia/Jerusalem)"))
  .catch((err) => console.error("Failed to register daily sync scheduler:", err))

for (const worker of workers) {
  worker.on("completed", (job) => {
    console.log(`[${job.queueName}] job ${job.id} completed`)
  })
  worker.on("failed", (job, err) => {
    console.error(`[${job?.queueName}] job ${job?.id} failed:`, err.message)
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
  console.log("Shutting down workers...")
  await Promise.all(workers.map((w) => w.close()))
  await shutdownPostHog()
  process.exit(0)
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
