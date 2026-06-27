import { Queue } from "bullmq"

const connection = {
  url: process.env.REDIS_URL!,
}

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 },
}

export const gmailSyncQueue = new Queue("gmail-sync", { connection, defaultJobOptions })
export const extractionQueue = new Queue("extraction", { connection, defaultJobOptions })
export const anomalyQueue = new Queue("anomaly", { connection, defaultJobOptions })
export const exportQueue = new Queue("exports", { connection, defaultJobOptions })

export type GmailSyncJobData = {
  organizationId: string
  mode: "full" | "incremental"
}

export type ExtractionJobData = {
  organizationId: string
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
