import { Worker, Job } from "bullmq"
import { prisma } from "@/lib/prisma"
import { getGmailClient, buildGmailMessageLink } from "@/lib/gmail"
import { redisUrl,type ExtractionJobData } from "@/lib/queues"
import { runExtraction } from "@/lib/extract-core"
import { linkInvoiceToMatchingFixedExpense } from "@/lib/link-fixed-expense"
import { parsePdfText } from "@/lib/receipt-link"
import { log } from "@/lib/posthog-server"
import { convert } from "html-to-text"

export type GmailPart = {
  mimeType?: string | null
  filename?: string | null
  parts?: GmailPart[]
  body?: { data?: string | null; attachmentId?: string | null; size?: number | null }
}

export type AttachmentMeta = {
  attachmentId: string
  filename: string
  mimeType: string
  size: number
}

export function createInvoiceExtractWorker() {
  return new Worker<ExtractionJobData>(
    "extraction",
    async (job: Job<ExtractionJobData>) => {
      const { organizationId, gmailCredentialId, gmailMessageId } = job.data

      // Trust boundary: derive the org from the credential, not the job payload,
      // so a tampered/mis-enqueued job can't file another mailbox's invoice under
      // the wrong org. See the matching guard in the gmail-sync worker.
      const credential = await prisma.gmailCredential.findUnique({
        where: { id: gmailCredentialId },
        select: { organizationId: true },
      })
      if (!credential) {
        log.error("extract: credential not found; skipping job", { gmailCredentialId })
        return { skipped: "credential-not-found" }
      }
      if (credential.organizationId !== organizationId) {
        log.error("extract: job organizationId does not match credential; refusing", {
          gmailCredentialId,
          jobOrganizationId: organizationId,
          credentialOrganizationId: credential.organizationId,
        })
        throw new Error("extract: job organizationId does not match credential")
      }

      return extractInvoice(credential.organizationId, gmailCredentialId, gmailMessageId)
    },
    { connection: { url: redisUrl() }, concurrency: 5 }
  )
}

async function extractInvoice(
  organizationId: string,
  gmailCredentialId: string,
  gmailMessageId: string
) {
  // Never resurrect or overwrite an invoice the user removed ("not an invoice" or
  // "not relevant"). removedAt is the removal signal — status is left untouched.
  const existing = await prisma.invoice.findUnique({
    where: { organizationId_gmailMessageId: { organizationId, gmailMessageId } },
    select: { id: true, removedAt: true },
  })
  if (existing?.removedAt) {
    return { invoiceId: existing.id, skipped: "removed_by_user" }
  }

  log.info("extract: extracting invoice from email", { gmailMessageId })

  const gmail = await getGmailClient(gmailCredentialId)

  const msg = await gmail.users.messages.get({
    userId: "me",
    id: gmailMessageId,
    format: "full",
  })

  const payload = msg.data.payload as GmailPart
  const headers = (msg.data.payload?.headers ?? []) as { name?: string; value?: string }[]

  const subject = headers.find((h) => h.name === "Subject")?.value ?? ""
  const fromHeader = headers.find((h) => h.name === "From")?.value ?? ""
  const dateHeader = headers.find((h) => h.name === "Date")?.value ?? ""

  const { senderEmail, senderName } = parseFrom(fromHeader)
  const emailDate = new Date(dateHeader)
  const gmailThreadId = msg.data.threadId ?? ""
  // Link to this message in the mailbox that holds it — `authuser=<email>` pins
  // the account and `#all/<id>` targets the exact message even when a forwarded
  // invoice was filtered out of the Inbox.
  const mailbox = await prisma.gmailCredential.findUnique({
    where: { id: gmailCredentialId },
    select: { email: true },
  })
  const gmailLink = buildGmailMessageLink(mailbox?.email ?? "", gmailMessageId)

  const bodyText = extractBodyText(payload)
  const bodyHtml = extractBodyHtml(payload)
  const attachmentMeta = extractAttachmentMeta(payload)

  // Fetch the PDF attachment bytes once, up front — the extraction core reuses
  // them for both text parsing and the LLM vision pass. Parsed in memory, never
  // stored (Gmail attachments are re-fetched on demand).
  const pdfBytes = await fetchAttachmentPdfBytes(gmail, gmailMessageId, attachmentMeta)

  const { extracted, extractionMethod, category, receiptUrl, convertedFields } =
    await runExtraction({
      organizationId,
      senderEmail,
      senderName,
      subject,
      bodyText,
      bodyHtml,
      docBytes: pdfBytes,
      docMimeType: pdfBytes ? "application/pdf" : null,
    })

  const invoice = await prisma.invoice.upsert({
    where: { organizationId_gmailMessageId: { organizationId, gmailMessageId } },
    create: {
      organizationId,
      gmailCredentialId,
      gmailMessageId,
      gmailThreadId,
      gmailLink,
      senderEmail,
      senderName,
      subject,
      emailDate,
      vendorName: extracted.vendorName,
      vendorNormalized: extracted.vendorNormalized,
      invoiceNumber: extracted.invoiceNumber,
      allocationNumber: extracted.allocationNumber,
      vendorTaxId: extracted.vendorTaxId,
      documentType: extracted.documentType,
      // Receipts are emailed the moment they're issued, so the email date is
      // a solid default when the document itself didn't yield one
      invoiceDate: extracted.invoiceDate ?? emailDate,
      dueDate: extracted.dueDate,
      totalAmount: extracted.totalAmount ?? 0,
      currency: extracted.currency,
      taxAmount: extracted.taxAmount,
      lineItems: extracted.lineItems as never,
      attachmentMeta: attachmentMeta as never,
      receiptUrl,
      extractionMethod,
      extractionConfidence: extracted.confidence,
      ...convertedFields,
      // create-only: never overwrite a user's manual category on re-extraction.
      ...(category ? { category } : {}),
    },
    update: {
      vendorName: extracted.vendorName,
      vendorNormalized: extracted.vendorNormalized,
      invoiceNumber: extracted.invoiceNumber,
      allocationNumber: extracted.allocationNumber,
      vendorTaxId: extracted.vendorTaxId,
      documentType: extracted.documentType,
      invoiceDate: extracted.invoiceDate ?? emailDate,
      dueDate: extracted.dueDate,
      totalAmount: extracted.totalAmount ?? 0,
      currency: extracted.currency,
      taxAmount: extracted.taxAmount,
      lineItems: extracted.lineItems as never,
      attachmentMeta: attachmentMeta as never,
      receiptUrl,
      extractionMethod,
      extractionConfidence: extracted.confidence,
      ...convertedFields,
    },
  })

  // Link to a matching fixed expense (arrival tracking) inline, so "has this
  // period's invoice arrived?" is answered as a natural consequence of ingestion
  // rather than a separate job. Best-effort — a failure here must never fail the
  // extraction. No-ops when the invoice is already linked or nothing matches.
  try {
    await linkInvoiceToMatchingFixedExpense(invoice)
  } catch (err) {
    log.warn("extract: fixed-expense link failed", {
      gmailMessageId,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  // NOTE: anomaly detection is not implemented yet — there is no detector and
  // no anomaly worker, so enqueuing `anomaly:check` here only piled unconsumed
  // jobs into Redis (AnomalyLog is never written). Removed so the batch drain
  // can reach idle. When anomaly detection is built, re-add the enqueue here
  // *and* an `anomaly` consumer in the worker set + the batch drain loop.

  log.info("extract: invoice saved", {
    gmailMessageId,
    vendor: extracted.vendorNormalized ?? extracted.vendorName ?? null,
    totalAmount: extracted.totalAmount ?? 0,
    currency: extracted.currency,
    method: extractionMethod,
  })

  return { invoiceId: invoice.id, confidence: extracted.confidence }
}

// ── Helpers ───────────────────────────────────────────────────────

const MAX_PDF_BYTES = 10 * 1024 * 1024

// Download the first reasonably-sized PDF attachment and return its raw bytes.
// The bytes are reused both for text parsing (heuristics) and, when enabled,
// the LLM vision extractor — so we only download the attachment once.
export async function fetchAttachmentPdfBytes(
  gmail: Awaited<ReturnType<typeof getGmailClient>>,
  gmailMessageId: string,
  attachments: AttachmentMeta[]
): Promise<Buffer | null> {
  // Match by mime OR filename — some senders (e.g. Partner) attach PDFs
  // as application/octet-stream
  const pdf = attachments.find(
    (a) =>
      (a.mimeType === "application/pdf" || a.filename.toLowerCase().endsWith(".pdf")) &&
      a.size > 0 &&
      a.size <= MAX_PDF_BYTES
  )
  if (!pdf) return null

  try {
    const res = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: gmailMessageId,
      id: pdf.attachmentId,
    })
    if (!res.data.data) return null
    return Buffer.from(res.data.data, "base64url")
  } catch {
    return null
  }
}

// Download the first reasonably-sized PDF attachment and return its text
export async function fetchAttachmentPdfText(
  gmail: Awaited<ReturnType<typeof getGmailClient>>,
  gmailMessageId: string,
  attachments: AttachmentMeta[]
): Promise<string | null> {
  const bytes = await fetchAttachmentPdfBytes(gmail, gmailMessageId, attachments)
  if (!bytes) return null
  try {
    return parsePdfText(bytes)
  } catch {
    return null
  }
}

export function parseFrom(from: string): { senderEmail: string; senderName: string | null } {
  const match = /^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/.exec(from.trim())
  return {
    senderName: match?.[1]?.trim() || null,
    senderEmail: match?.[2]?.trim() ?? from.trim(),
  }
}

function findPart(parts: GmailPart[], mimeType: string): GmailPart | null {
  for (const part of parts) {
    if (part.mimeType === mimeType) return part
    if (part.parts) {
      const found = findPart(part.parts, mimeType)
      if (found) return found
    }
  }
  return null
}

// Some senders (SendGrid/Manychat and similar) stuff HTML markup into the
// text/plain part, or the whole message body is a single unlabeled HTML blob.
// Both would otherwise reach the caller as raw tags. Detect markup and run it
// through html-to-text so extractBodyText always returns readable plain text.
function looksLikeHtml(s: string): boolean {
  return /<(!doctype\s+html|html\b|body\b|table\b|tr\b|td\b|div\b|p\b|br\s*\/?|span\b|a\s)/i.test(s)
}

function toPlainText(raw: string): string {
  return looksLikeHtml(raw) ? convert(raw, { wordwrap: false }) : raw
}

export function extractBodyText(payload: GmailPart): string {
  const parts = payload.parts ?? []

  const plain = findPart(parts, "text/plain")
  if (plain?.body?.data) {
    return toPlainText(Buffer.from(plain.body.data, "base64url").toString("utf8"))
  }

  const html = findPart(parts, "text/html")
  if (html?.body?.data) {
    const raw = Buffer.from(html.body.data, "base64url").toString("utf8")
    return convert(raw, { wordwrap: false })
  }

  if (payload.body?.data) {
    return toPlainText(Buffer.from(payload.body.data, "base64url").toString("utf8"))
  }

  return ""
}

// Raw HTML body, used for receipt-link discovery (links are gone after html-to-text)
export function extractBodyHtml(payload: GmailPart): string | null {
  const html = findPart(payload.parts ?? [], "text/html")
  if (html?.body?.data) {
    return Buffer.from(html.body.data, "base64url").toString("utf8")
  }
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf8")
  }
  return null
}

export function extractAttachmentMeta(payload: GmailPart): AttachmentMeta[] {
  const attachments: AttachmentMeta[] = []

  function walk(parts: GmailPart[]) {
    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          attachmentId: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType ?? "application/octet-stream",
          size: part.body.size ?? 0,
        })
      }
      if (part.parts) walk(part.parts)
    }
  }

  walk(payload.parts ?? [])
  return attachments
}
