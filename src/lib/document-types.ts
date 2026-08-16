// Single source of truth for invoice document types (Invoice / Receipt / Credit
// Note / Unknown). Shared by the Prisma enum (kept in lockstep — see
// schema.prisma `enum DocumentType`), the LLM vision extractor
// (llm-extractor.ts) and heuristics (invoice-detection.ts), the PATCH validation
// schema, and every UI surface (badge, filters, export).
//
// The distinction carries financial meaning: a TAX_INVOICE is a demand for
// payment, a RECEIPT confirms payment, and a CREDIT_INVOICE (credit note)
// reduces what is owed. UNKNOWN is the DB default and the fail-open value when
// the document can't be classified.
//
// Client-safe: no server/prisma imports, so both client (dialogs, toolbar) and
// server (routes, data layer) can use it.

export const DOCUMENT_TYPES = ["TAX_INVOICE", "RECEIPT", "CREDIT_INVOICE", "UNKNOWN"] as const

export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  TAX_INVOICE: "Invoice",
  RECEIPT: "Receipt",
  CREDIT_INVOICE: "Credit Note",
  UNKNOWN: "Unknown",
}

// Badge colors follow the CATEGORY_COLORS pattern (pastel bg + saturated fg) in
// src/lib/invoice-categories.ts.
export const DOCUMENT_TYPE_COLORS: Record<DocumentType, { bg: string; color: string }> = {
  TAX_INVOICE:    { bg: "#EFF6FF", color: "#2563EB" },
  RECEIPT:        { bg: "#ECFDF5", color: "#059669" },
  CREDIT_INVOICE: { bg: "#FFF7ED", color: "#EA580C" },
  UNKNOWN:        { bg: "#F1F3F8", color: "#94A3B8" },
}

// Types a user may assign from the UI. UNKNOWN is last so it reads as a "clear"
// option rather than a real document type.
export const DOCUMENT_TYPE_SELECTABLE: DocumentType[] = [
  ...DOCUMENT_TYPES.filter((t) => t !== "UNKNOWN"),
  "UNKNOWN",
]
