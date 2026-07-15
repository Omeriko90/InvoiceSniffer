import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rate-limit"
import {
  loadInvoicesForExport,
  isExportColumn,
  EXPORT_COLUMN_LABELS,
  type ExportColumn,
  type ExportInvoiceRow,
} from "@/lib/export-data"
import { putExportObject, getSignedExportUrl, exportObjectKey } from "@/lib/r2"
import { log } from "@/lib/posthog-server"
import { format as formatDate } from "date-fns"
import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"

// POST /api/invoices/export — synchronous CSV/XLSX export of the selected
// invoices with the chosen columns. The file is uploaded to R2 and recorded as a
// READY ExportJob so it shows up in history and can be re-downloaded, and a fresh
// signed URL is returned for the immediate download.

type Body = {
  format?: string
  invoiceIds?: string[]
  fields?: string[]
  dateRangeStart?: string
  dateRangeEnd?: string
}

const MAX_INVOICES = 5000

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user

  const body = (await req.json().catch(() => ({}))) as Body
  const fmt = body.format
  if (fmt !== "csv" && fmt !== "xlsx") {
    return NextResponse.json({ error: "format must be csv or xlsx" }, { status: 400 })
  }
  const invoiceIds = Array.isArray(body.invoiceIds) ? body.invoiceIds : []
  if (invoiceIds.length === 0) {
    return NextResponse.json({ error: "No invoices selected" }, { status: 400 })
  }
  if (invoiceIds.length > MAX_INVOICES) {
    return NextResponse.json({ error: `Too many invoices (max ${MAX_INVOICES})` }, { status: 400 })
  }

  // Keep only recognized columns, preserving the canonical display order.
  const requested = Array.isArray(body.fields) ? body.fields.filter(isExportColumn) : []
  const fields: ExportColumn[] = (Object.keys(EXPORT_COLUMN_LABELS) as ExportColumn[]).filter((c) =>
    requested.includes(c)
  )
  if (fields.length === 0) {
    return NextResponse.json({ error: "Select at least one column" }, { status: 400 })
  }

  const limited = await enforceRateLimit(`invoice-export:${organizationId}`, 20, 60_000)
  if (limited) return limited

  const rows = await loadInvoicesForExport(organizationId, invoiceIds)
  if (rows.length === 0) {
    return NextResponse.json({ error: "No matching invoices" }, { status: 404 })
  }

  const now = new Date()
  const start = body.dateRangeStart ? new Date(body.dateRangeStart) : now
  const end = body.dateRangeEnd ? new Date(body.dateRangeEnd) : now

  const job = await prisma.exportJob.create({
    data: {
      organizationId,
      format: fmt === "csv" ? "CSV" : "XLSX",
      dateRangeStart: start,
      dateRangeEnd: end,
      invoiceIds,
      fields,
      status: "BUILDING",
    },
    select: { id: true },
  })

  try {
    const ext = fmt
    const mimeType =
      fmt === "csv"
        ? "text/csv; charset=utf-8"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    const fileName = `invoices-${formatDate(now, "yyyy-MM-dd")}.${ext}`
    const bytes = fmt === "csv" ? buildCsv(rows, fields) : await buildXlsx(rows, fields)

    const key = exportObjectKey(organizationId, job.id, ext)
    await putExportObject(key, bytes, mimeType)

    // Signed URLs are short-lived; the R2 object is what actually persists for
    // re-download. Track a 30-day validity window on the record for the UI.
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    await prisma.exportJob.update({
      where: { id: job.id },
      data: { status: "READY", r2Key: key, fileName, mimeType, finishedAt: now, expiresAt },
    })

    const downloadUrl = await getSignedExportUrl(key, fileName)
    return NextResponse.json({ exportJobId: job.id, downloadUrl, fileName })
  } catch (error) {
    await prisma.exportJob
      .update({ where: { id: job.id }, data: { status: "FAILED", finishedAt: new Date() } })
      .catch(() => {})
    log.error("Spreadsheet export failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

// ─── file builders ───────────────────────────────────────────

function cellValue(row: ExportInvoiceRow, col: ExportColumn): string | number | null {
  switch (col) {
    case "vendorName":
      return row.vendorName ?? ""
    case "invoiceNumber":
      return row.invoiceNumber ?? ""
    case "invoiceDate":
      return row.invoiceDate ? formatDate(row.invoiceDate, "yyyy-MM-dd") : ""
    case "dueDate":
      return row.dueDate ? formatDate(row.dueDate, "yyyy-MM-dd") : ""
    case "totalAmount":
      return row.totalAmount
    case "currency":
      return row.currency
    case "taxAmount":
      return row.taxAmount ?? ""
  }
}

// RFC 4180: quote fields containing comma/quote/newline; escape quotes by doubling.
function csvEscape(value: string | number | null): string {
  const s = value == null ? "" : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function buildCsv(rows: ExportInvoiceRow[], fields: ExportColumn[]): Buffer {
  const header = fields.map((f) => csvEscape(EXPORT_COLUMN_LABELS[f])).join(",")
  const lines = rows.map((r) => fields.map((f) => csvEscape(cellValue(r, f))).join(","))
  // Prepend a UTF-8 BOM so Excel opens non-ASCII (e.g. Hebrew vendors) correctly.
  return Buffer.from("﻿" + [header, ...lines].join("\r\n"), "utf-8")
}

async function buildXlsx(rows: ExportInvoiceRow[], fields: ExportColumn[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Invoices")
  ws.columns = fields.map((f) => ({
    header: EXPORT_COLUMN_LABELS[f],
    key: f,
    width: f === "vendorName" ? 28 : 16,
  }))
  ws.getRow(1).font = { bold: true }
  for (const r of rows) {
    const record: Record<string, string | number> = {}
    for (const f of fields) {
      const v = cellValue(r, f)
      record[f] = v == null ? "" : v
    }
    ws.addRow(record)
  }
  const out = await wb.xlsx.writeBuffer()
  return Buffer.from(out)
}
