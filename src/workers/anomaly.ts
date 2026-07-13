import { Worker, Job } from "bullmq"
import { type AnomalyJobData } from "@/lib/queues"
import { runAnomalyDetection } from "@/lib/anomaly-detection"

const connection = { url: process.env.REDIS_URL! }

// Recomputes vendor baselines and flags spend anomalies for an org. Enqueued
// after each invoice extraction with a stable per-org jobId, so overlapping
// extractions coalesce to a single run that sees the full invoice set.
export function createAnomalyWorker() {
  return new Worker<AnomalyJobData>(
    "anomaly",
    async (job: Job<AnomalyJobData>) => {
      const { organizationId } = job.data
      return runAnomalyDetection(organizationId)
    },
    { connection, concurrency: 2 },
  )
}
