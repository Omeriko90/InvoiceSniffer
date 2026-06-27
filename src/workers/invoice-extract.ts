import { Worker, Job } from "bullmq"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getGmailClient } from "@/lib/gmail"
import { anomalyQueue, type ExtractionJobData, type AnomalyJobData } from "@/lib/queues"
import { extractInvoiceMetadata } from "@/lib/invoice-detection"
import { convert } from "html-to-text"

const connection = { url: process.env.REDIS_URL! }

type GmailPart = {
  mimeType?: string | null
  filename?: string | null
  parts?: GmailPart[]
  body?: { data?: string | null; attachmentId?: string | null; size?: number | null }
}

type AttachmentMeta = {
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
  const attachmentMeta = extractAttachmentMeta(payload)

  const extracted = extractInvoiceMetadata(senderEmail, senderName, subject, bodyText)

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
      invoiceDate: extracted.invoiceDate,
      dueDate: extracted.dueDate,
      totalAmount: extracted.totalAmount ?? 0,
      currency: extracted.currency,
      taxAmount: extracted.taxAmount,
      lineItems: extracted.lineItems as Prisma.InputJsonValue,
      attachmentMeta: attachmentMeta as unknown as Prisma.InputJsonValue,
      extractionMethod: "HEURISTIC",
      extractionConfidence: extracted.confidence,
    },
    update: {
      vendorName: extracted.vendorName,
      vendorNormalized: extracted.vendorNormalized,
      invoiceNumber: extracted.invoiceNumber,
      invoiceDate: extracted.invoiceDate,
      dueDate: extracted.dueDate,
      totalAmount: extracted.totalAmount ?? 0,
      currency: extracted.currency,
      taxAmount: extracted.taxAmount,
      lineItems: extracted.lineItems as Prisma.InputJsonValue,
      attachmentMeta: attachmentMeta as unknown as Prisma.InputJsonValue,
      extractionConfidence: extracted.confidence,
    },
  })

  if (extracted.vendorNormalized && extracted.totalAmount) {
    await anomalyQueue.add(
      "anomaly:check",
      { organizationId, invoiceId: invoice.id } satisfies AnomalyJobData,
      { jobId: `anomaly:${invoice.id}` }
    )
  }

  return { invoiceId: invoice.id, confidence: extracted.confidence }
}

// ── Helpers ───────────────────────────────────────────────────────

function parseFrom(from: string): { senderEmail: string; senderName: string | null } {
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

function extractBodyText(payload: GmailPart): string {
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

function extractAttachmentMeta(payload: GmailPart): AttachmentMeta[] {
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
