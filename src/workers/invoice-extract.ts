import { Worker, Job } from "bullmq"
import { prisma } from "@/lib/prisma"
import { getGmailClient, buildGmailMessageLink } from "@/lib/gmail"
import { redisUrl,type ExtractionJobData } from "@/lib/queues"
import { extractInvoiceMetadata, type ExtractedInvoice } from "@/lib/invoice-detection"
import { extractorEnabled, extractInvoiceFromPdf, type LlmExtraction } from "@/lib/llm-extractor"
import { categorizerEnabled, categorizeInvoice } from "@/lib/llm-categorizer"
import type { InvoiceCategory } from "@/lib/invoice-categories"
import { linkInvoiceToMatchingFixedExpense } from "@/lib/link-fixed-expense"
import { normalizeCurrencyCode } from "@/lib/currency"
import { convertForDisplay } from "@/lib/fx"
import { findReceiptUrl, fetchReceiptText, parsePdfText } from "@/lib/receipt-link"
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

  let extracted = extractInvoiceMetadata(senderEmail, senderName, subject, bodyText)

  // Fetch the PDF bytes once, up front — reused for both text parsing (below)
  // and the LLM vision extractor (Tier 2). Documents are parsed in memory and
  // never stored.
  const pdfBytes = await fetchAttachmentPdfBytes(gmail, gmailMessageId, attachmentMeta)

  // When the email body didn't yield an amount, dig deeper: first the PDF
  // attachment's text layer, then the hosted receipt link.
  if (!extracted.totalAmount && pdfBytes) {
    let pdfText: string | null = null
    try {
      pdfText = await parsePdfText(pdfBytes)
    } catch {
      pdfText = null
    }
    if (pdfText) {
      const fromPdf = extractInvoiceMetadata(senderEmail, senderName, subject, pdfText)
      extracted = mergeExtractions(extracted, fromPdf)
    }
  }

  // Whether the document is Israeli decides when the richer hosted-doc/LLM
  // extraction is worth it — heuristics never produce the Tax Authority
  // allocation number, so a missing one is reason enough to dig deeper even when
  // an amount was already found. Re-evaluated as `extracted` gains fields.
  const isIsraeli = () =>
    extracted.currency === "ILS" || /[֐-׿]/.test(`${subject}\n${bodyText}`)

  // Follow the hosted receipt link when a gap remains: no amount yet, or an
  // Israeli doc still missing its allocation number. A linked PDF is captured as
  // bytes so it can feed the same Tier 2 LLM path an attachment does; an HTML
  // page is parsed to text and merged.
  const receiptUrl = bodyHtml ? findReceiptUrl(bodyHtml) : null
  let remotePdfBytes: Buffer | null = null
  if (receiptUrl && (!extracted.totalAmount || (isIsraeli() && !extracted.allocationNumber))) {
    const remote = await fetchReceiptText(receiptUrl)
    if (remote?.text) {
      const parsed = extractInvoiceMetadata(senderEmail, senderName, subject, remote.text)
      extracted = mergeExtractions(extracted, parsed)
    }
    remotePdfBytes = remote?.pdfBytes ?? null
  }

  // Tier 2: structured LLM vision extraction. Runs only when it uniquely helps
  // and a PDF exists — from the attachment or, failing that, the linked receipt:
  // either the cheaper signals never found an amount (the deferred mojibake/RTL
  // fallback), or this is an Israeli document missing the Tax Authority
  // allocation number (which the regex heuristics never extract).
  const docBytes = pdfBytes ?? remotePdfBytes
  let extractionMethod: "HEURISTIC" | "AI" = "HEURISTIC"
  // Category read off the full document by the vision extractor, when it ran.
  // Preferred over the text-only categorizer below because it sees the actual
  // PDF (logo, layout, line items) — the richest signal available.
  let visionCategory: InvoiceCategory | undefined
  if (extractorEnabled() && docBytes) {
    // Run the vision extractor when the cheap signals left a gap it can close:
    // no amount at all, or an Israeli document still missing its Tax Authority
    // allocation number OR its VAT (both of which the LLM reads reliably and the
    // regex heuristics routinely miss on RTL-mangled PDFs).
    const needsLlm =
      !extracted.totalAmount ||
      (isIsraeli() && (!extracted.allocationNumber || !extracted.taxAmount))
    if (needsLlm) {
      const source = pdfBytes ? "attachment" : "link"
      console.log(`[invoice-extract] Tier 2 LLM on ${source} PDF for ${gmailMessageId}`)
      const llm = await extractInvoiceFromPdf({ pdfBytes: docBytes, subject, senderEmail })
      if (llm) {
        extracted = applyLlmExtraction(extracted, llm)
        extractionMethod = "AI"
        // The vision extractor also classifies the expense off the full
        // document; treat UNCATEGORIZED as "no opinion" so the text-only
        // fallback below still gets a shot.
        if (llm.category !== "UNCATEGORIZED") visionCategory = llm.category
      }
    }
  }

  // Category, best signal first: the vision extractor's read of the full
  // document when there was a PDF (attachment or linked), else a cheap text-only
  // LLM call (vendor + subject + line items — the only option for HTML-linked or
  // body-only invoices with no PDF). Fail-open to the DB default. Only ever
  // applied on create below, never on update, so it can't clobber a user's
  // manual category (or the original auto-category) when a message re-extracts.
  let category: InvoiceCategory | undefined = visionCategory
  if (!category && categorizerEnabled()) {
    category =
      (await categorizeInvoice({
        vendorName: extracted.vendorName,
        subject,
        senderEmail,
        lineItems: extracted.lineItems,
      })) ?? undefined
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { displayCurrency: true },
  })
  const displayCurrency = org?.displayCurrency ?? "USD"
  const originalCurrency = normalizeCurrencyCode(extracted.currency)
  const conversion = await convertForDisplay(
    extracted.totalAmount ?? 0,
    originalCurrency,
    displayCurrency
  )
  const convertedFields = conversion
    ? {
        displayAmount: conversion.displayAmount,
        displayCurrency: conversion.displayCurrency,
        fxRate: conversion.fxRate,
        fxAsOf: conversion.fxAsOf,
      }
    : {}

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

// Field-wise merge: email-body values win, the fetched document fills the gaps
function mergeExtractions(email: ExtractedInvoice, remote: ExtractedInvoice): ExtractedInvoice {
  return {
    vendorName: email.vendorName ?? remote.vendorName,
    vendorNormalized: email.vendorNormalized ?? remote.vendorNormalized,
    invoiceNumber: email.invoiceNumber ?? remote.invoiceNumber,
    allocationNumber: email.allocationNumber ?? remote.allocationNumber,
    vendorTaxId: email.vendorTaxId ?? remote.vendorTaxId,
    documentType: email.documentType !== "UNKNOWN" ? email.documentType : remote.documentType,
    invoiceDate: email.invoiceDate ?? remote.invoiceDate,
    dueDate: email.dueDate ?? remote.dueDate,
    totalAmount: email.totalAmount ?? remote.totalAmount,
    currency: email.totalAmount ? email.currency : remote.currency,
    taxAmount: email.taxAmount ?? remote.taxAmount,
    lineItems: email.lineItems.length > 0 ? email.lineItems : remote.lineItems,
    confidence: Math.max(email.confidence, remote.confidence),
  }
}

// Overlay an LLM extraction onto the heuristic result. The LLM read the
// rendered page, so it's authoritative for the Israeli fields the heuristics
// never produce (allocation number, tax id, document type, line items) and
// fills any gaps the heuristics left; existing heuristic values are kept where
// present. Confidence is bumped to reflect the richer extraction.
function applyLlmExtraction(base: ExtractedInvoice, llm: LlmExtraction): ExtractedInvoice {
  const llmDate = (raw: string | null): Date | null => {
    if (!raw) return null
    const d = new Date(raw)
    return isNaN(d.getTime()) ? null : d
  }

  // The LLM read the rendered page, so its money figures beat the regex's
  // guesses at mojibake/RTL text — prefer them, falling back to the heuristic
  // only when the LLM returned null.
  const totalAmount = llm.totalAmount ?? base.totalAmount
  let taxAmount = llm.vatAmount ?? base.taxAmount

  // Reconcile subtotal + VAT = total while all three LLM numbers are still in
  // scope (subtotalAmount is never persisted). Derive a missing VAT from the
  // subtotal, and reject a VAT that neither matches nor can be reconciled.
  const sub = llm.subtotalAmount
  if (totalAmount != null) {
    const tol = Math.max(0.02, totalAmount * 0.01)
    if (sub != null && taxAmount != null) {
      if (Math.abs(sub + taxAmount - totalAmount) > tol) {
        const derived = totalAmount - sub
        taxAmount = derived >= 0 && derived < totalAmount ? derived : null
      }
    } else if (sub != null && taxAmount == null) {
      const derived = totalAmount - sub
      if (derived >= 0) taxAmount = derived
    }
    // Clamp: VAT can never exceed the total.
    if (taxAmount != null && taxAmount > totalAmount) taxAmount = null
  }

  return {
    vendorName: base.vendorName ?? llm.vendorName,
    vendorNormalized: base.vendorNormalized,
    invoiceNumber: base.invoiceNumber ?? llm.invoiceNumber,
    allocationNumber: llm.allocationNumber ?? base.allocationNumber,
    vendorTaxId: llm.vendorTaxId ?? base.vendorTaxId,
    documentType: llm.documentType !== "UNKNOWN" ? llm.documentType : base.documentType,
    invoiceDate: base.invoiceDate ?? llmDate(llm.invoiceDate),
    dueDate: base.dueDate ?? llmDate(llm.dueDate),
    totalAmount,
    currency: llm.totalAmount ? (llm.currency ?? base.currency) : base.currency,
    taxAmount,
    lineItems: llm.lineItems.length > 0 ? llm.lineItems : base.lineItems,
    confidence: Math.max(base.confidence, 0.95),
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
