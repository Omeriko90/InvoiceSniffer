import { Queue } from "bullmq"

// A Redis connection must NEVER be opened at import time. `next build` evaluates
// route modules (which transitively import this file), and the build environment
// has no Redis — with `url` undefined, BullMQ/ioredis silently fall back to
// 127.0.0.1:6379 and spam ECONNREFUSED. So each queue is built lazily on first
// use (at runtime, when REDIS_URL is present), and we fail fast with a clear
// message if it's missing rather than dialing localhost.
function connection() {
  const url = process.env.REDIS_URL
  if (!url) throw new Error("REDIS_URL is not set — cannot connect to the job queue")
  return { url }
}

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 },
}

// Memoized accessor: constructs the Queue (and thus the Redis connection) on the
// first call, then returns the same instance. Call as `gmailSyncQueue()`.
function lazyQueue(name: string): () => Queue {
  let instance: Queue | undefined
  return () => (instance ??= new Queue(name, { connection: connection(), defaultJobOptions }))
}

export const gmailSyncQueue = lazyQueue("gmail-sync")
export const extractionQueue = lazyQueue("extraction")
export const anomalyQueue = lazyQueue("anomaly")
export const exportQueue = lazyQueue("exports")

export type GmailSyncJobData = {
  organizationId: string
  credentialId: string
  mode: "full" | "incremental"
}

export type ExtractionJobData = {
  organizationId: string
  gmailCredentialId: string
  gmailMessageId: string
}

export type AnomalyJobData = {
  organizationId: string
  invoiceId: string
}

export type ExportJobData = {
  exportJobId: string
  organizationId: string
}
