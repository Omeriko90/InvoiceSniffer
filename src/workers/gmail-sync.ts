import { Worker, Job } from "bullmq"
import { prisma } from "@/lib/prisma"
import { getGmailClient } from "@/lib/gmail"
import { extractionQueue, type GmailSyncJobData, type ExtractionJobData } from "@/lib/queues"
import { detectInvoiceCandidate } from "@/lib/invoice-detection"
import type { gmail_v1 } from "googleapis"

const connection = { url: process.env.REDIS_URL! }
const PAGE_SIZE = 50

export function createGmailSyncWorker() {
  return new Worker<GmailSyncJobData>(
    "gmail-sync",
    async (job: Job<GmailSyncJobData>) => {
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

// ── Full sync: page through all Gmail messages ────────────────────

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
      q: "has:attachment OR subject:invoice OR subject:receipt OR subject:bill",
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
  const msg = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "metadata",
    metadataHeaders: ["From", "Subject", "Date"],
  })

  const headers = msg.data.payload?.headers ?? []
  const subject = headers.find((h) => h.name === "Subject")?.value ?? ""
  const snippet = msg.data.snippet ?? ""

  const attachments = (msg.data.payload?.parts ?? [])
    .filter((p) => p.filename && p.body?.attachmentId)
    .map((p) => ({ filename: p.filename!, mimeType: p.mimeType! }))

  const { isCandidate } = detectInvoiceCandidate(subject, snippet, attachments)

  if (isCandidate) {
    await extractionQueue.add(
      "invoice:extract",
      { organizationId, gmailMessageId: messageId } satisfies ExtractionJobData,
      { jobId: `extract:${organizationId}:${messageId}` } // dedup
    )
  }

  return isCandidate
}

function isGoogleError(err: unknown): err is { code: number } {
  return typeof err === "object" && err !== null && "code" in err
}
