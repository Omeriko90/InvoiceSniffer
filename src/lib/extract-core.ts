import { prisma } from "@/lib/prisma"
import { extractInvoiceMetadata, type ExtractedInvoice } from "@/lib/invoice-detection"
import {
  extractorEnabled,
  extractInvoiceFromDocument,
  extractInvoiceFromText,
  type LlmExtraction,
} from "@/lib/llm-extractor"
import { categorizerEnabled, categorizeInvoice } from "@/lib/llm-categorizer"
import type { InvoiceCategory } from "@/lib/invoice-categories"
import { normalizeCurrencyCode } from "@/lib/currency"
import { convertForDisplay } from "@/lib/fx"
import { findReceiptUrl, fetchReceiptText, parsePdfText } from "@/lib/receipt-link"

// Channel-agnostic invoice extraction. The Gmail worker and the WhatsApp worker
// both feed a normalized document into this and persist the result with their
// own provenance — so the tier hierarchy (heuristics → PDF text → hosted receipt
// link → LLM vision → LLM text → categorize → FX) lives in exactly one place.
export type ExtractionInput = {
  organizationId: string
  // Sender context. Email address for Gmail; null for channels without one
  // (e.g. WhatsApp, whose sender is a phone number).
  senderEmail: string | null
  senderName: string | null
  // Channel-neutral title (email subject / media caption / generated title).
  subject: string
  // Plain-text body, "" when there is none (e.g. a WhatsApp image with no caption).
  bodyText: string
  // Raw HTML body, used only for hosted-receipt-link discovery. null for
  // non-email channels — the receipt-link tier then no-ops.
  bodyHtml: string | null
  // Primary document bytes (email PDF attachment / WhatsApp media) and its mime.
  // null when the message carried no document.
  docBytes: Buffer | null
  docMimeType: string | null
}

export type ExtractionOutcome = {
  extracted: ExtractedInvoice
  extractionMethod: "HEURISTIC" | "AI"
  // Undefined = "no opinion"; the caller must not overwrite an existing category.
  category?: InvoiceCategory
  receiptUrl: string | null
  convertedFields: {
    displayAmount?: number
    displayCurrency?: string
    fxRate?: number
    fxAsOf?: Date
  }
}

function isPdf(mimeType: string | null): boolean {
  // Treat an unknown mime on present bytes as PDF — the Gmail path only ever
  // hands us PDFs, and parsePdfText fails closed on anything that isn't one.
  return mimeType === "application/pdf" || mimeType == null
}

export async function runExtraction(input: ExtractionInput): Promise<ExtractionOutcome> {
  const { organizationId, senderName, subject, bodyText, bodyHtml } = input
  const senderEmail = input.senderEmail ?? ""

  let extracted = extractInvoiceMetadata(senderEmail, senderName, subject, bodyText)

  // When the body didn't yield an amount, dig into the document's text layer
  // (PDF only — images have none).
  if (!extracted.totalAmount && input.docBytes && isPdf(input.docMimeType)) {
    let pdfText: string | null = null
    try {
      pdfText = await parsePdfText(input.docBytes)
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

  // Follow the hosted receipt link (email channel only) when a gap remains: no
  // amount yet, or an Israeli doc still missing its allocation number.
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

  // LLM vision extraction. Runs on the primary document (any mime) or, failing
  // that, a linked receipt PDF — when the cheap signals left a gap it can close:
  // no amount at all, or an Israeli document still missing its Tax Authority
  // allocation number OR its VAT (both of which the LLM reads reliably and the
  // regex heuristics routinely miss on RTL-mangled PDFs). Images always trip
  // `!totalAmount` (no text layer), so they always reach the LLM.
  const docBytes = input.docBytes ?? remotePdfBytes
  const docMimeType = input.docBytes ? (input.docMimeType ?? "application/pdf") : "application/pdf"
  let extractionMethod: "HEURISTIC" | "AI" = "HEURISTIC"
  let visionCategory: InvoiceCategory | undefined
  if (extractorEnabled() && docBytes) {
    const needsLlm =
      !extracted.totalAmount ||
      (isIsraeli() && (!extracted.allocationNumber || !extracted.taxAmount))
    if (needsLlm) {
      const llm = await extractInvoiceFromDocument({
        bytes: docBytes,
        mimeType: docMimeType,
        subject,
        senderEmail,
      })
      if (llm) {
        extracted = applyLlmExtraction(extracted, llm)
        extractionMethod = "AI"
        // Treat UNCATEGORIZED as "no opinion" so the text-only fallback still runs.
        if (llm.category !== "UNCATEGORIZED") visionCategory = llm.category
      }
    }
  }

  if (extractorEnabled() && !docBytes && bodyText.trim()) {
    const llm = await extractInvoiceFromText({ bodyText, subject, senderEmail })
    if (llm) {
      extracted = applyLlmExtraction(extracted, llm)
      extractionMethod = "AI"
      visionCategory = llm.category
    }
  }

  // Category, best signal first: the vision extractor's read of the full
  // document, else a cheap text-only LLM call. Fail-open to undefined so the
  // caller keeps the DB default / a user's manual category.
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

  return { extracted, extractionMethod, category, receiptUrl, convertedFields }
}

// Field-wise merge: body values win, the fetched document fills the gaps.
export function mergeExtractions(
  email: ExtractedInvoice,
  remote: ExtractedInvoice
): ExtractedInvoice {
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
export function applyLlmExtraction(base: ExtractedInvoice, llm: LlmExtraction): ExtractedInvoice {
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