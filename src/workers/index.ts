import "dotenv/config"
import { createGmailSyncWorker, registerDailySyncScheduler } from "./gmail-sync"
import { createInvoiceExtractWorker } from "./invoice-extract"

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
  })
}

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down workers...")
  await Promise.all(workers.map((w) => w.close()))
  process.exit(0)
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
