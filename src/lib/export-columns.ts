// Client-safe export column definitions — no server/prisma imports, so both the
// export dialog (client) and the export routes/data layer (server) can use them.

// The columns a user can export, in display order. The set stops at taxAmount —
// email-related fields (sender, subject, gmailLink, emailDate) and status are
// deliberately excluded.
export const EXPORT_COLUMNS = [
  "vendorName",
  "invoiceNumber",
  "invoiceDate",
  "dueDate",
  "totalAmount",
  "currency",
  "taxAmount",
] as const

export type ExportColumn = (typeof EXPORT_COLUMNS)[number]

export const EXPORT_COLUMN_LABELS: Record<ExportColumn, string> = {
  vendorName: "Vendor",
  invoiceNumber: "Invoice #",
  invoiceDate: "Invoice Date",
  dueDate: "Due Date",
  totalAmount: "Amount",
  currency: "Currency",
  taxAmount: "Tax Amount",
}

export function isExportColumn(value: string): value is ExportColumn {
  return (EXPORT_COLUMNS as readonly string[]).includes(value)
}
