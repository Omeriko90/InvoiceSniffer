import { Worker, Job } from "bullmq"
import { prisma } from "@/lib/prisma"
import { getGmailClient } from "@/lib/gmail"
import { gmailSyncQueue, extractionQueue, type GmailSyncJobData, type ExtractionJobData } from "@/lib/queues"
import { detectInvoiceCandidate } from "@/lib/invoice-detection"
import type { gmail_v1 } from "googleapis"

const connection = { url: process.env.REDIS_URL! }
const PAGE_SIZE = 50

// Full sync only looks back 3 months; matches are then scored by
// detectInvoiceCandidate before extraction is queued
const SYNC_QUERY =
  "newer_than:3m (has:attachment OR subject:invoice OR subject:receipt OR subject:bill OR subject:חשבונית OR subject:קבלה)"

// Daily fan-out job name — enqueues a per-org sync for every connected org
const SYNC_ALL_JOB = "gmail:sync-all"

export function createGmailSyncWorker() {
  return new Worker<GmailSyncJobData>(
    "gmail-sync",
    async (job: Job<GmailSyncJobData>) => {
      if (job.name === SYNC_ALL_JOB) {
        return enqueueSyncForAllOrgs()
      }

      const { organizationId, mode } = job.data

      if (mode === "full") {
        await runFullSync(organizationId, job)
      } else {
        await runIncrementalSync(organizationId, job)
      }
    },
    { connection, concurrency: 3 }
  )
}

// Idempotent — upsert keyed by scheduler id, safe to call on every startup
export async function registerDailySyncScheduler() {
  await gmailSyncQueue.upsertJobScheduler(
    "daily-gmail-sync",
    { pattern: "0 6 * * *", tz: "Asia/Jerusalem" },
    { name: SYNC_ALL_JOB }
  )
}

async function enqueueSyncForAllOrgs() {
  const orgs = await prisma.organization.findMany({
    where: { gmailConnected: true },
    select: { id: true, gmailSyncToken: true },
  })

  for (const org of orgs) {
    await gmailSyncQueue.add(
      "gmail:sync",
      { organizationId: org.id, mode: org.gmailSyncToken ? "incremental" : "full" } satisfies GmailSyncJobData,
      { jobId: `sync-${org.id}-${Date.now()}` }
    )
  }

  return { enqueued: orgs.length }
}

// ── Full sync: page through the last 3 months of Gmail messages ────

async function runFullSync(organizationId: string, job: Job) {
  const gmail = await getGmailClient(organizationId)
  let pageToken: string | undefined
  let totalProcessed = 0
  let candidatesFound = 0

  await job.updateProgress({ phase: "scanning", processed: 0, candidates: 0 })

  do {
    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: PAGE_SIZE,
      pageToken,
      q: SYNC_QUERY,
    })

    const messages = res.data.messages ?? []
    pageToken = res.data.nextPageToken ?? undefined

    for (const msg of messages) {
      if (!msg.id) continue

      // Skip if already in DB
      const exists = await prisma.invoice.findUnique({
        where: { organizationId_gmailMessageId: { organizationId, gmailMessageId: msg.id } },
        select: { id: true },
      })
      if (exists) continue

      const isCandidate = await checkAndQueueMessage(gmail, organizationId, msg.id)
      if (isCandidate) candidatesFound++
      totalProcessed++
    }

    await job.updateProgress({ phase: "scanning", processed: totalProcessed, candidates: candidatesFound })
  } while (pageToken)

  // Store historyId for future incremental syncs
  const profile = await gmail.users.getProfile({ userId: "me" })
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      gmailSyncToken: profile.data.historyId ?? null,
      lastSyncedAt: new Date(),
    },
  })

  return { totalProcessed, candidatesFound }
}

// ── Incremental sync: fetch only new messages since last historyId ─

async function runIncrementalSync(organizationId: string, job: Job) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { gmailSyncToken: true },
  })

  if (!org?.gmailSyncToken) {
    // No history token yet — fall back to full sync
    await job.log("No historyId found, falling back to full sync")
    return runFullSync(organizationId, job)
  }

  const gmail = await getGmailClient(organizationId)
  let candidatesFound = 0

  try {
    const res = await gmail.users.history.list({
      userId: "me",
      startHistoryId: org.gmailSyncToken,
      historyTypes: ["messageAdded"],
    })

    const history = res.data.history ?? []
    const newHistoryId = res.data.historyId

    const messageIds = new Set<string>()
    for (const item of history) {
      for (const added of item.messagesAdded ?? []) {
        if (added.message?.id) messageIds.add(added.message.id)
      }
    }

    for (const messageId of messageIds) {
      const exists = await prisma.invoice.findUnique({
        where: { organizationId_gmailMessageId: { organizationId, gmailMessageId: messageId } },
        select: { id: true },
      })
      if (exists) continue

      const isCandidate = await checkAndQueueMessage(gmail, organizationId, messageId)
      if (isCandidate) candidatesFound++
    }

    if (newHistoryId) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { gmailSyncToken: newHistoryId, lastSyncedAt: new Date() },
      })
    }
  } catch (err: unknown) {
    // historyId too old (410 Gone) — do a full sync instead
    if (isGoogleError(err) && err.code === 410) {
      await job.log("historyId expired, falling back to full sync")
      return runFullSync(organizationId, job)
    }
    throw err
  }

  return { candidatesFound }
}

// ── Check a single message and queue extraction if it's a candidate ─

async function checkAndQueueMessage(
  gmail: gmail_v1.Gmail,
  organizationId: string,
  messageId: string
): Promise<boolean> {
  // format:"full" (not "metadata") — metadata responses omit payload.parts,
  // so attachment-based detection signals would never fire
  const msg = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  })

  const headers = msg.data.payload?.headers ?? []
  const subject = headers.find((h) => h.name === "Subject")?.value ?? ""
  const snippet = msg.data.snippet ?? ""

  const attachments = collectAttachments(msg.data.payload)

  const { isCandidate } = detectInvoiceCandidate(subject, snippet, attachments)

  if (isCandidate) {
    await extractionQueue.add(
      "invoice:extract",
      { organizationId, gmailMessageId: messageId } satisfies ExtractionJobData,
      { jobId: `extract-${organizationId}-${messageId}` } // dedup
    )
  }

  return isCandidate
}

// Attachments can be nested inside multipart/* parts, so walk recursively
function collectAttachments(
  part: gmail_v1.Schema$MessagePart | undefined
): { filename: string; mimeType: string }[] {
  if (!part) return []
  const own =
    part.filename && part.body?.attachmentId
      ? [{ filename: part.filename, mimeType: part.mimeType ?? "" }]
      : []
  return own.concat((part.parts ?? []).flatMap(collectAttachments))
}

function isGoogleError(err: unknown): err is { code: number } {
  return typeof err === "object" && err !== null && "code" in err
}
