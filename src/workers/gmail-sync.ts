import { Worker, Job } from "bullmq"
import { prisma } from "@/lib/prisma"
import { getGmailClient } from "@/lib/gmail"
import { gmailSyncQueue, extractionQueue, type GmailSyncJobData, type ExtractionJobData } from "@/lib/queues"
import { detectInvoiceCandidate, CANDIDATE_THRESHOLD } from "@/lib/invoice-detection"
import { classifyInvoiceEmail, classifierEnabled, type ClassifierExample } from "@/lib/llm-classifier"
import { parseFrom } from "./invoice-extract"
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
        return enqueueSyncForAllCredentials()
      }

      const { organizationId, credentialId, mode } = job.data

      if (mode === "full") {
        await runFullSync(credentialId, organizationId, job)
      } else {
        await runIncrementalSync(credentialId, organizationId, job)
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

async function enqueueSyncForAllCredentials() {
  // One job per connected mailbox across all orgs — the daily fan-out must key
  // off credentials, not orgs, now that an org can have several mailboxes.
  const credentials = await prisma.gmailCredential.findMany({
    where: { connected: true },
    select: { id: true, organizationId: true, syncToken: true },
  })

  for (const cred of credentials) {
    await gmailSyncQueue.add(
      "gmail:sync",
      {
        organizationId: cred.organizationId,
        credentialId: cred.id,
        mode: cred.syncToken ? "incremental" : "full",
      } satisfies GmailSyncJobData,
      // Stable id (no timestamp) so a concurrent daily + on-demand sync for the
      // same mailbox dedupes to one job instead of double-scanning Gmail.
      { jobId: `sync-${cred.id}` }
    )
  }

  return { enqueued: credentials.length }
}

// ── Full sync: page through the last 3 months of Gmail messages ────

async function runFullSync(credentialId: string, organizationId: string, job: Job) {
  const gmail = await getGmailClient(credentialId)
  const ctx = await loadSyncContext(organizationId)
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

      const isCandidate = await checkAndQueueMessage(gmail, organizationId, credentialId, msg.id, ctx)
      if (isCandidate) candidatesFound++
      totalProcessed++
    }

    await job.updateProgress({ phase: "scanning", processed: totalProcessed, candidates: candidatesFound })
  } while (pageToken)

  // Store historyId for future incremental syncs
  const profile = await gmail.users.getProfile({ userId: "me" })
  await prisma.gmailCredential.update({
    where: { id: credentialId },
    data: {
      syncToken: profile.data.historyId ?? null,
      lastSyncedAt: new Date(),
    },
  })

  return { totalProcessed, candidatesFound }
}

// ── Incremental sync: fetch only new messages since last historyId ─

async function runIncrementalSync(credentialId: string, organizationId: string, job: Job) {
  const credential = await prisma.gmailCredential.findUnique({
    where: { id: credentialId },
    select: { syncToken: true },
  })

  if (!credential?.syncToken) {
    // No history token yet — fall back to full sync
    await job.log("No historyId found, falling back to full sync")
    return runFullSync(credentialId, organizationId, job)
  }

  const gmail = await getGmailClient(credentialId)
  const ctx = await loadSyncContext(organizationId)
  let candidatesFound = 0

  try {
    const res = await gmail.users.history.list({
      userId: "me",
      startHistoryId: credential.syncToken,
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

      const isCandidate = await checkAndQueueMessage(gmail, organizationId, credentialId, messageId, ctx)
      if (isCandidate) candidatesFound++
    }

    if (newHistoryId) {
      await prisma.gmailCredential.update({
        where: { id: credentialId },
        data: { syncToken: newHistoryId, lastSyncedAt: new Date() },
      })
    }
  } catch (err: unknown) {
    // historyId too old (410 Gone) — do a full sync instead
    if (isGoogleError(err) && err.code === 410) {
      await job.log("historyId expired, falling back to full sync")
      return runFullSync(credentialId, organizationId, job)
    }
    throw err
  }

  return { candidatesFound }
}

// ── Per-sync learning context: user feedback applied to detection ───

// Heuristic scores in this band are ambiguous enough to ask the LLM
// (candidate threshold is 40); outside it the heuristics decide alone
const BORDERLINE_MIN = 30
const BORDERLINE_MAX = 55

// A "not an invoice" mark penalizes the sender's score rather than blocking
// outright — senders often mix invoices with statements/marketing, and a
// strong invoice signal should still get through (or reach the LLM band).
// The penalty is graduated: each mark stacks, each confirmed invoice from
// the same sender offsets a mark, and it only applies while the sender's
// IGNORE rule is active (deleting the rule in Settings clears it).
const SENDER_PENALTY_STEP = 15
const SENDER_PENALTY_MAX = 45

type SyncContext = {
  senderPenalties: Map<string, number>
  examples: ClassifierExample[]
}

// Loaded once per sync run, not per message
async function loadSyncContext(organizationId: string): Promise<SyncContext> {
  const [ignoreRules, feedbackCounts, negatives, positives] = await Promise.all([
    prisma.vendorAlias.findMany({
      where: { organizationId, type: "IGNORE", active: true, senderEmail: { not: null } },
      select: { senderEmail: true },
    }),
    // Per-sender feedback tallies: IGNORED marks raise the penalty,
    // confirmed invoices (MATCHED/REVIEWED) lower it
    prisma.invoice.groupBy({
      by: ["senderEmail", "status"],
      where: { organizationId, status: { in: ["IGNORED", "MATCHED", "REVIEWED"] } },
      _count: true,
    }),
    prisma.invoice.findMany({
      where: { organizationId, status: "IGNORED" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { subject: true, senderEmail: true },
    }),
    prisma.invoice.findMany({
      where: { organizationId, status: { in: ["MATCHED", "REVIEWED"] } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { subject: true, senderEmail: true },
    }),
  ])

  const marks = new Map<string, { ignored: number; confirmed: number }>()
  for (const row of feedbackCounts) {
    const sender = row.senderEmail.toLowerCase()
    const entry = marks.get(sender) ?? { ignored: 0, confirmed: 0 }
    if (row.status === "IGNORED") entry.ignored += row._count
    else entry.confirmed += row._count
    marks.set(sender, entry)
  }

  const senderPenalties = new Map<string, number>()
  for (const rule of ignoreRules) {
    const sender = rule.senderEmail!.toLowerCase()
    const { ignored, confirmed } = marks.get(sender) ?? { ignored: 1, confirmed: 0 }
    const penalty = Math.min(
      SENDER_PENALTY_MAX,
      Math.max(0, SENDER_PENALTY_STEP * (ignored - confirmed))
    )
    if (penalty > 0) senderPenalties.set(sender, penalty)
  }

  return {
    senderPenalties,
    examples: [
      ...negatives.map((i) => ({ subject: i.subject, senderEmail: i.senderEmail, isInvoice: false })),
      ...positives.map((i) => ({ subject: i.subject, senderEmail: i.senderEmail, isInvoice: true })),
    ],
  }
}

// ── Check a single message and queue extraction if it's a candidate ─

async function checkAndQueueMessage(
  gmail: gmail_v1.Gmail,
  organizationId: string,
  credentialId: string,
  messageId: string,
  ctx: SyncContext
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
  const fromHeader = headers.find((h) => h.name === "From")?.value ?? ""
  const snippet = msg.data.snippet ?? ""

  const { senderEmail } = parseFrom(fromHeader)
  const penalty = ctx.senderPenalties.get(senderEmail.toLowerCase()) ?? 0

  const attachments = collectAttachments(msg.data.payload)

  const detection = detectInvoiceCandidate(subject, snippet, attachments)
  const score = detection.totalScore - penalty
  let isCandidate = score >= CANDIDATE_THRESHOLD

  // Ambiguous score — let the LLM decide, few-shot on this org's feedback
  if (classifierEnabled() && score >= BORDERLINE_MIN && score <= BORDERLINE_MAX) {
    const verdict = await classifyInvoiceEmail({
      subject,
      snippet,
      senderEmail,
      attachmentNames: attachments.map((a) => a.filename),
      examples: ctx.examples,
    })
    if (verdict) isCandidate = verdict.isInvoice
  }

  // The rule flipped a would-be candidate to skipped — record the save so
  // the Settings "learned rules" card shows it working
  if (penalty > 0 && detection.isCandidate && !isCandidate) {
    await prisma.vendorAlias.updateMany({
      where: {
        organizationId,
        type: "IGNORE",
        active: true,
        senderEmail: senderEmail.toLowerCase(),
      },
      data: { useCount: { increment: 1 } },
    })
  }

  if (isCandidate) {
    await extractionQueue.add(
      "invoice:extract",
      { organizationId, gmailCredentialId: credentialId, gmailMessageId: messageId } satisfies ExtractionJobData,
      { jobId: `extract-${credentialId}-${messageId}` } // dedup
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
