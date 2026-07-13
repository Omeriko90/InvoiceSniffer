import { Worker, Job } from "bullmq"
import { prisma } from "@/lib/prisma"
import { getGmailClient } from "@/lib/gmail"
import { anomalyQueue, type ExtractionJobData, type AnomalyJobData } from "@/lib/queues"
import { extractInvoiceMetadata, type ExtractedInvoice } from "@/lib/invoice-detection"
import { findReceiptUrl, fetchReceiptText, parsePdfText } from "@/lib/receipt-link"
import { convert } from "html-to-text"

const connection = { url: process.env.REDIS_URL! }

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
      const { organizationId, gmailMessageId } = job.data
      return extractInvoice(organizationId, gmailMessageId)
    },
    { connection, concurrency: 5 }
  )
}

async function extractInvoice(organizationId: string, gmailMessageId: string) {
  // Never overwrite an invoice the user explicitly marked "not an invoice"
  const existing = await prisma.invoice.findUnique({
    where: { organizationId_gmailMessageId: { organizationId, gmailMessageId } },
    select: { id: true, status: true },
  })
  if (existing?.status === "IGNORED") {
    return { invoiceId: existing.id, skipped: "ignored_by_user" }
  }

  const gmail = await getGmailClient(organizationId)

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
  const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${gmailThreadId}`

  const bodyText = extractBodyText(payload)
  const bodyHtml = extractBodyHtml(payload)
  const attachmentMeta = extractAttachmentMeta(payload)

  let extracted = extractInvoiceMetadata(senderEmail, senderName, subject, bodyText)

  // When the email body didn't yield an amount, dig deeper: first any PDF
  // attachment, then the hosted receipt link. Documents are parsed in memory
  // and never stored.
  if (!extracted.totalAmount) {
    const pdfText = await fetchAttachmentPdfText(gmail, gmailMessageId, attachmentMeta)
    if (pdfText) {
      const fromPdf = extractInvoiceMetadata(senderEmail, senderName, subject, pdfText)
      extracted = mergeExtractions(extracted, fromPdf)
    }
  }

  const receiptUrl = bodyHtml ? findReceiptUrl(bodyHtml) : null
  if (receiptUrl && !extracted.totalAmount) {
    const remoteText = await fetchReceiptText(receiptUrl)
    if (remoteText) {
      const remote = extractInvoiceMetadata(senderEmail, senderName, subject, remoteText)
      extracted = mergeExtractions(extracted, remote)
    }
  }

  const invoice = await prisma.invoice.upsert({
    where: { organizationId_gmailMessageId: { organizationId, gmailMessageId } },
    create: {
      organizationId,
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
      extractionMethod: "HEURISTIC",
      extractionConfidence: extracted.confidence,
    },
    update: {
      vendorName: extracted.vendorName,
      vendorNormalized: extracted.vendorNormalized,
      invoiceNumber: extracted.invoiceNumber,
      invoiceDate: extracted.invoiceDate ?? emailDate,
      dueDate: extracted.dueDate,
      totalAmount: extracted.totalAmount ?? 0,
      currency: extracted.currency,
      taxAmount: extracted.taxAmount,
      lineItems: extracted.lineItems as never,
      attachmentMeta: attachmentMeta as never,
      receiptUrl,
      extractionConfidence: extracted.confidence,
    },
  })

  // Trigger org-level anomaly detection. Stable jobId coalesces the flood of
  // per-invoice enqueues during a sync into one run that sees the full invoice
  // set; the `anomaly` consumer is registered in the worker set and the batch
  // drain loop so this settles before the drain exits.
  await anomalyQueue.add(
    "anomaly:check",
    { organizationId } satisfies AnomalyJobData,
    { jobId: `anomaly-${organizationId}` },
  )

  return { invoiceId: invoice.id, confidence: extracted.confidence }
}

// ── Helpers ───────────────────────────────────────────────────────

const MAX_PDF_BYTES = 10 * 1024 * 1024

// Download the first reasonably-sized PDF attachment and return its text
export async function fetchAttachmentPdfText(
  gmail: Awaited<ReturnType<typeof getGmailClient>>,
  gmailMessageId: string,
  attachments: AttachmentMeta[]
): Promise<string | null> {
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
    return parsePdfText(Buffer.from(res.data.data, "base64url"))
  } catch {
    return null
  }
}

// Field-wise merge: email-body values win, the fetched document fills the gaps
function mergeExtractions(email: ExtractedInvoice, remote: ExtractedInvoice): ExtractedInvoice {
  return {
    vendorName: email.vendorName ?? remote.vendorName,
    vendorNormalized: email.vendorNormalized ?? remote.vendorNormalized,
    invoiceNumber: email.invoiceNumber ?? remote.invoiceNumber,
    invoiceDate: email.invoiceDate ?? remote.invoiceDate,
    dueDate: email.dueDate ?? remote.dueDate,
    totalAmount: email.totalAmount ?? remote.totalAmount,
    currency: email.totalAmount ? email.currency : remote.currency,
    taxAmount: email.taxAmount ?? remote.taxAmount,
    lineItems: email.lineItems.length > 0 ? email.lineItems : remote.lineItems,
    confidence: Math.max(email.confidence, remote.confidence),
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

export function extractBodyText(payload: GmailPart): string {
  const parts = payload.parts ?? []

  const plain = findPart(parts, "text/plain")
  if (plain?.body?.data) {
    return Buffer.from(plain.body.data, "base64url").toString("utf8")
  }

  const html = findPart(parts, "text/html")
  if (html?.body?.data) {
    const raw = Buffer.from(html.body.data, "base64url").toString("utf8")
    return convert(raw, { wordwrap: false })
  }

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf8")
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
