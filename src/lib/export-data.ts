import { prisma } from "@/lib/prisma"
import type { DateRange } from "@/lib/matching-data"
import type { AttachmentMeta } from "@/workers/invoice-extract"

// Data loaders for the export flow. Shared by the spreadsheet route (sync) and
// the PDF export runner (async). Scoped by organizationId; the effective-date
// filter mirrors loadInvoiceCandidates (invoiceDate ?? emailDate).

// Column definitions live in a client-safe module (no prisma import) so the
// export dialog can share them. Re-exported here for server-side convenience.
export {
  EXPORT_COLUMNS,
  EXPORT_COLUMN_LABELS,
  isExportColumn,
  type ExportColumn,
} from "@/lib/export-columns"

// Row shape for spreadsheet generation — Decimals coerced to numbers.
export type ExportInvoiceRow = {
  id: string
  vendorName: string | null
  invoiceNumber: string | null
  invoiceDate: Date | null
  dueDate: Date | null
  totalAmount: number
  currency: string
  taxAmount: number | null
}

// Extra fields the PDF runner needs on top of the exportable columns.
export type PdfExportInvoice = ExportInvoiceRow & {
  gmailMessageId: string
  gmailCredentialId: string | null
  attachmentMeta: AttachmentMeta[]
}

const PDF_SELECT = {
  id: true,
  vendorName: true,
  invoiceNumber: true,
  invoiceDate: true,
  dueDate: true,
  totalAmount: true,
  currency: true,
  taxAmount: true,
  gmailMessageId: true,
  gmailCredentialId: true,
  attachmentMeta: true,
} as const

// Invoices selected by explicit id (from the export dialog), scoped to the org.
// Returned in the order the ids were given so the merged PDF / rows are stable.
export async function loadInvoicesForExport(
  organizationId: string,
  invoiceIds: string[]
): Promise<PdfExportInvoice[]> {
  if (invoiceIds.length === 0) return []
  const rows = await prisma.invoice.findMany({
    where: { organizationId, id: { in: invoiceIds } },
    select: PDF_SELECT,
  })
  const byId = new Map(rows.map((r) => [r.id, r]))
  return invoiceIds
    .map((id) => byId.get(id))
    .filter((r): r is (typeof rows)[number] => Boolean(r))
    .map(toPdfExportInvoice)
}

// Invoices whose effective date (invoiceDate ?? emailDate) falls in the range —
// powers the export dialog's preview list. Excludes IGNORED.
export async function loadInvoicesInRange(
  organizationId: string,
  range: DateRange
): Promise<ExportInvoiceRow[]> {
  const rows = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { not: "IGNORED" },
      OR: [
        { invoiceDate: { gte: range.from, lte: range.to } },
        { invoiceDate: null, emailDate: { gte: range.from, lte: range.to } },
      ],
    },
    orderBy: [{ invoiceDate: "desc" }, { emailDate: "desc" }],
    select: {
      id: true,
      vendorName: true,
      invoiceNumber: true,
      invoiceDate: true,
      dueDate: true,
      totalAmount: true,
      currency: true,
      taxAmount: true,
    },
  })
  return rows.map(toExportRow)
}

function toExportRow(r: {
  id: string
  vendorName: string | null
  invoiceNumber: string | null
  invoiceDate: Date | null
  dueDate: Date | null
  totalAmount: { toString(): string }
  currency: string
  taxAmount: { toString(): string } | null
}): ExportInvoiceRow {
  return {
    id: r.id,
    vendorName: r.vendorName,
    invoiceNumber: r.invoiceNumber,
    invoiceDate: r.invoiceDate,
    dueDate: r.dueDate,
    totalAmount: Number(r.totalAmount),
    currency: r.currency,
    taxAmount: r.taxAmount == null ? null : Number(r.taxAmount),
  }
}

function toPdfExportInvoice(r: {
  id: string
  vendorName: string | null
  invoiceNumber: string | null
  invoiceDate: Date | null
  dueDate: Date | null
  totalAmount: { toString(): string }
  currency: string
  taxAmount: { toString(): string } | null
  gmailMessageId: string
  gmailCredentialId: string | null
  attachmentMeta: unknown
}): PdfExportInvoice {
  return {
    ...toExportRow(r),
    gmailMessageId: r.gmailMessageId,
    gmailCredentialId: r.gmailCredentialId,
    attachmentMeta: (r.attachmentMeta as AttachmentMeta[]) ?? [],
  }
}
