import type { DocumentType } from "@/lib/document-types"
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
  // Amount converted to the org display currency at arrival; null on older/
  // unconverted invoices (fall back to totalAmount/currency). displayCurrency
  // is the display currency that was in effect when this invoice arrived.
  displayAmount: string | null
  displayCurrency: string | null
  taxAmount: string | null
  emailDate: string
  invoiceDate: string | null
  dueDate: string | null
  extractionConfidence: number
  status: InvoiceStatus
  category: InvoiceCategory
  documentType: DocumentType
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

export type StatusMeta = { label: string; badge: string }
