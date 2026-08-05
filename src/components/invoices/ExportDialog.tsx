// Client component by import — only ever rendered from <InvoicesClient>.
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { format as formatDate } from "date-fns"
import { FormDialog } from "@/components/ui/form-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  INVOICE_DATE_PRESETS,
  resolveInvoiceDateRange,
  type InvoiceDatePreset,
} from "@/lib/invoice-date-filter"
import { EXPORT_COLUMNS, EXPORT_COLUMN_LABELS, type ExportColumn } from "@/lib/export-columns"
import {
  fetchExportPreview,
  createSpreadsheetExport,
  createPdfExport,
  type ExportFormat,
} from "@/api/exports"
import { useExports } from "@/components/exports/ExportsProvider"
import { track } from "@/lib/analytics"
import { DateRangePreset, PRESET_LABELS } from "@/lib/date-range"

type Scope = { preset: InvoiceDatePreset } | { from: string; to: string }

function isPreset(s: Scope): s is { preset: InvoiceDatePreset } {
  return "preset" in s
}

// Calendar-aware presets shared with the Invoices list, minus "All time" — an
// unbounded export isn't offered (the server caps custom ranges anyway).
const EXPORT_PRESETS = INVOICE_DATE_PRESETS.filter((p) => p !== "all")

const FORMAT_LABELS: Record<ExportFormat, string> = { csv: "CSV", xlsx: "Excel", pdf: "PDF" }

function triggerBrowserDownload(url: string) {
  const a = document.createElement("a")
  a.href = url
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function ExportDialog({
  format,
  onClose,
}: {
  format: ExportFormat
  onClose: () => void
}) {
  const { trackExport } = useExports()
  const isSpreadsheet = format === "csv" || format === "xlsx"

  const [scope, setScope] = useState<Scope>({ preset: "thisMonth" })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [columns, setColumns] = useState<Set<ExportColumn>>(new Set(EXPORT_COLUMNS))
  const [submitting, setSubmitting] = useState(false)

  const custom = !isPreset(scope)
  const rangeValid = !custom || (Boolean(scope.from) && Boolean(scope.to))

  const range = useMemo(() => {
    if (!rangeValid) return null
    // None of the offered presets is "all", so this never returns null here.
    return resolveInvoiceDateRange(scope, new Date())
  }, [scope, rangeValid])

  const fromISO = range?.from.toISOString() ?? ""
  const toISO = range?.to.toISOString() ?? ""

  const preview = useQuery({
    queryKey: ["export-preview", fromISO, toISO],
    queryFn: () => fetchExportPreview(fromISO, toISO),
    enabled: Boolean(range),
  })

  const invoices = useMemo(() => preview.data ?? [], [preview.data])

  // Default to everything selected whenever the loaded set changes. Adjusting
  // state during render (rather than in an effect) is the React-recommended way
  // to reset state when derived-from data changes — no cascading effect render.
  const invoicesKey = useMemo(() => invoices.map((i) => i.id).join(","), [invoices])
  const [prevKey, setPrevKey] = useState<string | null>(null)
  if (invoicesKey !== prevKey) {
    setPrevKey(invoicesKey)
    setSelectedIds(new Set(invoices.map((i) => i.id)))
  }

  const allSelected = invoices.length > 0 && selectedIds.size === invoices.length

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(invoices.map((i) => i.id)))
  }

  function toggleColumn(col: ExportColumn) {
    setColumns((prev) => {
      const next = new Set(prev)
      if (next.has(col)) next.delete(col)
      else next.add(col)
      return next
    })
  }

  async function handleExport() {
    if (!range) return
    const invoiceIds = invoices.filter((i) => selectedIds.has(i.id)).map((i) => i.id)
    if (invoiceIds.length === 0) {
      toast.error("Select at least one invoice")
      return
    }
    if (isSpreadsheet && columns.size === 0) {
      toast.error("Select at least one column")
      return
    }

    setSubmitting(true)
    try {
      if (isSpreadsheet) {
        const fields = EXPORT_COLUMNS.filter((c) => columns.has(c))
        const { downloadUrl } = await createSpreadsheetExport({
          format,
          invoiceIds,
          fields,
          dateRangeStart: fromISO,
          dateRangeEnd: toISO,
        })
        triggerBrowserDownload(downloadUrl)
        toast.success(`${FORMAT_LABELS[format]} export ready`, {
          description: `${invoiceIds.length} invoice${invoiceIds.length === 1 ? "" : "s"} exported.`,
        })
      } else {
        const { exportJobId } = await createPdfExport({
          invoiceIds,
          dateRangeStart: fromISO,
          dateRangeEnd: toISO,
        })
        trackExport(exportJobId)
      }
      track("invoice_exported", { format, count: invoiceIds.length })
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormDialog
      className="sm:max-w-155"
      footerClassName="rounded-b-lg bg-surface flex items-center justify-end gap-2.5"
      title={`Export invoices as ${FORMAT_LABELS[format]}`}
      description={
        format === "pdf"
          ? "The selected invoices' PDFs are merged into a single document. You'll get a notification when it's ready to download."
          : "Choose a date range, deselect any invoices you don't want, and pick which columns to include."
      }
      footer={
        <>
          <span className="text-[12.5px] text-text-secondary mr-auto">
            {selectedIds.size} of {invoices.length} selected
          </span>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={submitting || selectedIds.size === 0}>
            {submitting ? "Working…" : format === "pdf" ? "Build PDF" : `Export ${FORMAT_LABELS[format]}`}
          </Button>
        </>
      }
    >
      <div className="px-5.5 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
        {/* Date range */}
        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-bold uppercase tracking-tight text-text-secondary">
            Date range
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {EXPORT_PRESETS.map((p) => {
              const on = isPreset(scope) && scope.preset === p
              return (
                <Button
                  key={p}
                  variant="ghost"
                  onClick={() => setScope({ preset: p })}
                  className="h-auto px-3.5 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer"
                  style={{ background: on ? "#EEF3FF" : "#F1F3F8", color: on ? "#3B6FE0" : "#64748B" }}
                >
                  {PRESET_LABELS[p as DateRangePreset]}
                </Button>
              )
            })}
            <Button
              variant="ghost"
              onClick={() => setScope(custom ? scope : { from: "", to: "" })}
              className="h-auto px-3.5 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer"
              style={{ background: custom ? "#EEF3FF" : "#F1F3F8", color: custom ? "#3B6FE0" : "#64748B" }}
            >
              Custom
              </Button>
          </div>
          {custom && (
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                From
                <Input
                  type="date"
                  value={scope.from}
                  onChange={(e) => setScope({ from: e.target.value, to: scope.to })}
                  className="h-auto py-2 px-2.5 text-sm w-40 border-border rounded"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                To
                <Input
                  type="date"
                  value={scope.to}
                  onChange={(e) => setScope({ from: scope.from, to: e.target.value })}
                  className="h-auto py-2 px-2.5 text-sm w-40 border-border rounded"
                />
              </label>
            </div>
          )}
        </div>

        {/* Columns (spreadsheet only) */}
        {isSpreadsheet && (
          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-bold uppercase tracking-tight text-text-secondary">
              Columns
            </p>
            <div className="flex flex-wrap gap-x-4.5 gap-y-2">
              {EXPORT_COLUMNS.map((col) => (
                <label key={col} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                  <Checkbox checked={columns.has(col)} onCheckedChange={() => toggleColumn(col)} />
                  {EXPORT_COLUMN_LABELS[col]}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Invoice list */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-tight text-text-secondary">
              Invoices
            </p>
            {invoices.length > 0 && (
              <Button
                variant="link"
                onClick={toggleAll}
                className="h-auto p-0 rounded-none text-sm font-semibold text-primary cursor-pointer hover:no-underline"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </Button>
            )}
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            {preview.isLoading ? (
              <div className="px-3.5 py-6 text-center text-sm text-text-secondary">Loading…</div>
            ) : preview.isError ? (
              <div className="px-3.5 py-6 text-center text-sm text-destructive">
                Failed to load invoices.
              </div>
            ) : invoices.length === 0 ? (
              <div className="px-3.5 py-6 text-center text-sm text-text-secondary">
                No invoices in this range.
              </div>
            ) : (
              <ul className="divide-y divide-border max-h-60 overflow-y-auto">
                {invoices.map((inv) => {
                  const date = inv.invoiceDate ?? inv.dueDate
                  return (
                    <li key={inv.id}>
                      <label className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-surface">
                        <Checkbox
                          checked={selectedIds.has(inv.id)}
                          onCheckedChange={() => toggleRow(inv.id)}
                        />
                        <span className="flex-1 min-w-0 truncate text-sm font-semibold text-text-primary">
                          {inv.vendorName ?? "Unknown vendor"}
                        </span>
                        <span className="text-sm text-text-secondary shrink-0">
                          {date ? formatDate(new Date(date), "dd MMM yyyy") : "—"}
                        </span>
                        <span className="text-sm font-semibold text-text-primary shrink-0 w-23 text-right">
                          {inv.currency} {inv.totalAmount.toFixed(2)}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </FormDialog>
  )
}
