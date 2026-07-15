// Client-side fetchers for the export flow.

export type ExportFormat = "csv" | "xlsx" | "pdf"

export type ExportPreviewInvoice = {
  id: string
  vendorName: string | null
  invoiceNumber: string | null
  invoiceDate: string | null
  dueDate: string | null
  totalAmount: number
  currency: string
  taxAmount: number | null
}

export type ExportStatusResponse = {
  id: string
  status: "QUEUED" | "BUILDING" | "READY" | "EXPIRED" | "FAILED"
  format: "CSV" | "XLSX" | "PDF"
  fileName: string | null
  skippedCount: number
  ready: boolean
}

export type ExportHistoryItem = {
  id: string
  format: "CSV" | "XLSX" | "PDF"
  status: "QUEUED" | "BUILDING" | "READY" | "EXPIRED" | "FAILED"
  fileName: string | null
  dateRangeStart: string
  dateRangeEnd: string
  skippedCount: number
  createdAt: string
  expiresAt: string | null
}

async function parseError(res: Response, fallback: string): Promise<never> {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? fallback)
}

export async function fetchExportPreview(
  from: string,
  to: string
): Promise<ExportPreviewInvoice[]> {
  const res = await fetch(`/api/invoices/export-preview?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
  if (!res.ok) await parseError(res, "Failed to load invoices")
  const body = (await res.json()) as { invoices: ExportPreviewInvoice[] }
  return body.invoices
}

export async function createSpreadsheetExport(input: {
  format: "csv" | "xlsx"
  invoiceIds: string[]
  fields: string[]
  dateRangeStart: string
  dateRangeEnd: string
}): Promise<{ exportJobId: string; downloadUrl: string; fileName: string }> {
  const res = await fetch("/api/invoices/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) await parseError(res, "Export failed")
  return res.json()
}

export async function createPdfExport(input: {
  invoiceIds: string[]
  dateRangeStart: string
  dateRangeEnd: string
}): Promise<{ exportJobId: string }> {
  const res = await fetch("/api/exports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) await parseError(res, "Failed to start export")
  return res.json()
}

export async function fetchExportStatus(id: string): Promise<ExportStatusResponse> {
  const res = await fetch(`/api/exports/${id}`)
  if (!res.ok) await parseError(res, "Failed to load export status")
  return res.json()
}

export async function fetchExportsHistory(): Promise<ExportHistoryItem[]> {
  const res = await fetch("/api/exports")
  if (!res.ok) await parseError(res, "Failed to load exports")
  const body = (await res.json()) as { exports: ExportHistoryItem[] }
  return body.exports
}

// Downloads via the server redirect, which mints a fresh signed R2 URL.
export function downloadExport(id: string): void {
  window.location.assign(`/api/exports/${id}/download`)
}
