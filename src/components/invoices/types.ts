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
  emailDate: string
  invoiceDate: string | null
  dueDate: string | null
  extractionConfidence: number
  status: InvoiceStatus
  gmailLink: string
  senderEmail: string
  senderName: string | null
  subject: string
  attachmentMeta: AttachmentMeta[]
  receiptUrl: string | null
  sourceAccount: { email: string; label: string | null } | null
}

export type StatusMeta = { label: string; bg: string; color: string }
