import type { Prisma } from "@prisma/client"
import type { InvoiceRow } from "@/components/invoices/types"

// Single source of truth for the columns and shape behind an InvoiceRow, shared
// by the invoices list page and GET /api/invoices/[id] so the two can't drift.
export const INVOICE_ROW_SELECT = {
  id: true,
  vendorName: true,
  invoiceNumber: true,
  totalAmount: true,
  currency: true,
  taxAmount: true,
  emailDate: true,
  invoiceDate: true,
  dueDate: true,
  extractionConfidence: true,
  status: true,
  category: true,
  documentType: true,
  gmailLink: true,
  senderEmail: true,
  senderName: true,
  subject: true,
  attachmentMeta: true,
  receiptUrl: true,
  gmailCredential: { select: { email: true, label: true } },
  fixedExpense: { select: { id: true, name: true } },
} satisfies Prisma.InvoiceSelect

type InvoiceRowRecord = Prisma.InvoiceGetPayload<{ select: typeof INVOICE_ROW_SELECT }>

// Serialize a selected invoice row (Decimal/Date -> string) into the client type.
export function toInvoiceRow(inv: InvoiceRowRecord): InvoiceRow {
  return {
    id: inv.id,
    vendorName: inv.vendorName,
    invoiceNumber: inv.invoiceNumber,
    totalAmount: inv.totalAmount.toString(),
    currency: inv.currency,
    taxAmount: inv.taxAmount?.toString() ?? null,
    emailDate: inv.emailDate.toISOString(),
    invoiceDate: inv.invoiceDate?.toISOString() ?? null,
    dueDate: inv.dueDate?.toISOString() ?? null,
    extractionConfidence: inv.extractionConfidence,
    status: inv.status as InvoiceRow["status"],
    category: inv.category,
    documentType: inv.documentType,
    gmailLink: inv.gmailLink,
    senderEmail: inv.senderEmail,
    senderName: inv.senderName,
    subject: inv.subject,
    attachmentMeta: inv.attachmentMeta as InvoiceRow["attachmentMeta"],
    receiptUrl: inv.receiptUrl,
    sourceAccount: inv.gmailCredential
      ? { email: inv.gmailCredential.email, label: inv.gmailCredential.label }
      : null,
    fixedExpense: inv.fixedExpense,
  }
}
