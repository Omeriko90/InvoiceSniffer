import type { InvoiceCategory } from "@/lib/invoice-categories"

export type InvoiceStatus = "DETECTED" | "MATCHED" | "UNMATCHED" | "REVIEWED" | "IGNORED"

export type UIState = "data" | "loading" | "empty"

export type AttachmentMeta = {
  filename: string
  mimeType: string
  size: number
}

export type InvoiceRow = {
  id: string
  vendorName: string | null
  invoiceNumber: string | null
  totalAmount: string
  currency: string
  taxAmount: string | null
  emailDate: string
  invoiceDate: string | null
  dueDate: string | null
  extractionConfidence: number
  status: InvoiceStatus
  category: InvoiceCategory
  gmailLink: string
  senderEmail: string
  senderName: string | null
  subject: string
  attachmentMeta: AttachmentMeta[]
  receiptUrl: string | null
  sourceAccount: { email: string; label: string | null } | null
  // Set when this invoice is linked to a fixed expense — drives the drawer's
  // "Fixed expense · {name}" indication.
  fixedExpense: { id: string; name: string } | null
}

export type StatusMeta = { label: string; bg: string; color: string }
