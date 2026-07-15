// Client component by import — only ever rendered from <InvoicesClient>.
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { format as formatDate } from "date-fns"
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  DATE_RANGE_PRESETS,
  PRESET_LABELS,
  resolveDateRange,
  type DateRangePreset,
} from "@/lib/date-range"
import { EXPORT_COLUMNS, EXPORT_COLUMN_LABELS, type ExportColumn } from "@/lib/export-columns"
import {
  fetchExportPreview,
  createSpreadsheetExport,
  createPdfExport,
  type ExportFormat,
} from "@/api/exports"
import { useExports } from "@/components/exports/ExportsProvider"

type Scope = { preset: DateRangePreset } | { from: string; to: string }

function isPreset(s: Scope): s is { preset: DateRangePreset } {
  return "preset" in s
}

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

  const [scope, setScope] = useState<Scope>({ preset: "month" })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [columns, setColumns] = useState<Set<ExportColumn>>(new Set(EXPORT_COLUMNS))
  const [submitting, setSubmitting] = useState(false)

  const custom = !isPreset(scope)
  const rangeValid = !custom || (Boolean(scope.from) && Boolean(scope.to))

  const range = useMemo(() => {
    if (!rangeValid) return null
    return resolveDateRange(scope, new Date())
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
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-[620px] p-0 gap-0 bg-white border-[#E8EDFA] rounded-[16px]">
      <DialogHeader className="px-[22px] pt-[20px] pb-[14px] border-b border-[#F1F3F8]">
        <DialogTitle className="text-[16px] font-[700] text-heading">
          Export invoices as {FORMAT_LABELS[format]}
        </DialogTitle>
        <DialogDescription className="text-[12.5px] text-[#64748B]">
          {format === "pdf"
            ? "The selected invoices' PDFs are merged into a single document. You'll get a notification when it's ready to download."
            : "Choose a date range, deselect any invoices you don't want, and pick which columns to include."}
        </DialogDescription>
      </DialogHeader>

      <div className="px-[22px] py-[16px] flex flex-col gap-[16px] max-h-[60vh] overflow-y-auto">
        {/* Date range */}
        <div className="flex flex-col gap-[10px]">
          <p className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-text-secondary">
            Date range
          </p>
          <div className="flex flex-wrap items-center gap-[6px]">
            {DATE_RANGE_PRESETS.map((p) => {
              const on = isPreset(scope) && scope.preset === p
              return (
                <button
                  key={p}
                  onClick={() => setScope({ preset: p })}
                  className="px-[13px] py-[7px] rounded-full text-[13px] font-[600] transition-colors cursor-pointer"
                  style={{ background: on ? "#EEF3FF" : "#F1F3F8", color: on ? "#3B6FE0" : "#64748B" }}
                >
                  {PRESET_LABELS[p]}
                </button>
              )
            })}
            <button
              onClick={() => setScope(custom ? scope : { from: "", to: "" })}
              className="px-[13px] py-[7px] rounded-full text-[13px] font-[600] transition-colors cursor-pointer"
              style={{ background: custom ? "#EEF3FF" : "#F1F3F8", color: custom ? "#3B6FE0" : "#64748B" }}
            >
              Custom
            </button>
          </div>
          {custom && (
            <div className="flex flex-wrap items-center gap-[10px]">
              <label className="flex items-center gap-[8px] text-[13px] text-text-secondary">
                From
                <Input
                  type="date"
                  value={scope.from}
                  onChange={(e) => setScope({ from: e.target.value, to: scope.to })}
                  className="h-auto py-[7px] px-[10px] text-[13px] w-[160px] border-border rounded"
                />
              </label>
              <label className="flex items-center gap-[8px] text-[13px] text-text-secondary">
                To
                <Input
                  type="date"
                  value={scope.to}
                  onChange={(e) => setScope({ from: scope.from, to: e.target.value })}
                  className="h-auto py-[7px] px-[10px] text-[13px] w-[160px] border-border rounded"
                />
              </label>
            </div>
          )}
        </div>

        {/* Columns (spreadsheet only) */}
        {isSpreadsheet && (
          <div className="flex flex-col gap-[10px]">
            <p className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-text-secondary">
              Columns
            </p>
            <div className="flex flex-wrap gap-x-[18px] gap-y-[8px]">
              {EXPORT_COLUMNS.map((col) => (
                <label key={col} className="flex items-center gap-[8px] text-[13px] text-text-primary cursor-pointer">
                  <Checkbox checked={columns.has(col)} onCheckedChange={() => toggleColumn(col)} />
                  {EXPORT_COLUMN_LABELS[col]}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Invoice list */}
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center justify-between">
            <p className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-text-secondary">
              Invoices
            </p>
            {invoices.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-[12.5px] font-[600] text-[#3B6FE0] cursor-pointer"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            )}
          </div>

          <div className="border border-[#E8EDFA] rounded-[10px] overflow-hidden">
            {preview.isLoading ? (
              <div className="px-[14px] py-[24px] text-center text-[13px] text-text-secondary">Loading…</div>
            ) : preview.isError ? (
              <div className="px-[14px] py-[24px] text-center text-[13px] text-destructive">
                Failed to load invoices.
              </div>
            ) : invoices.length === 0 ? (
              <div className="px-[14px] py-[24px] text-center text-[13px] text-text-secondary">
                No invoices in this range.
              </div>
            ) : (
              <ul className="divide-y divide-[#F1F3F8] max-h-[240px] overflow-y-auto">
                {invoices.map((inv) => {
                  const date = inv.invoiceDate ?? inv.dueDate
                  return (
                    <li key={inv.id}>
                      <label className="flex items-center gap-[10px] px-[12px] py-[9px] cursor-pointer hover:bg-[#FAFBFF]">
                        <Checkbox
                          checked={selectedIds.has(inv.id)}
                          onCheckedChange={() => toggleRow(inv.id)}
                        />
                        <span className="flex-1 min-w-0 truncate text-[13px] font-[600] text-text-primary">
                          {inv.vendorName ?? "Unknown vendor"}
                        </span>
                        <span className="text-[12px] text-text-secondary shrink-0">
                          {date ? formatDate(new Date(date), "dd MMM yyyy") : "—"}
                        </span>
                        <span className="text-[12.5px] font-[600] text-text-primary shrink-0 w-[92px] text-right">
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

      <DialogFooter className="rounded-b-[16px] bg-white px-[22px] py-[14px] border-t border-[#F1F3F8] flex items-center justify-end gap-[10px]">
        <span className="text-[12.5px] text-text-secondary mr-auto">
          {selectedIds.size} of {invoices.length} selected
        </span>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleExport} disabled={submitting || selectedIds.size === 0}>
          {submitting ? "Working…" : format === "pdf" ? "Build PDF" : `Export ${FORMAT_LABELS[format]}`}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
