"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format as formatDate } from "date-fns"
import { ChevronDown, ChevronRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useExports } from "@/components/exports/ExportsProvider"
import { fetchExportsHistory, downloadExport, type ExportHistoryItem } from "@/api/exports"
import { cn } from "@/lib/utils"

const STATUS_STYLE: Record<ExportHistoryItem["status"], { label: string; className: string }> = {
  QUEUED: { label: "Queued", className: "bg-hover text-text-secondary" },
  BUILDING: { label: "Building…", className: "bg-[#FEF6E7] text-[#B7791F]" },
  READY: { label: "Ready", className: "bg-[#E7F6EC] text-[#1A9C4E]" },
  EXPIRED: { label: "Expired", className: "bg-hover text-dim" },
  FAILED: { label: "Failed", className: "bg-[#FDECEC] text-[#D64545]" },
}

// Machine skip reasons (from the PDF build worker) → human copy.
const SKIP_REASON_LABEL: Record<string, string> = {
  no_source: "No attachment or email content to include",
  // Retained so historical exports built before the rename still render.
  no_pdf_attachment: "No PDF attachment on the email",
  gmail_not_connected: "Gmail account no longer connected",
  fetch_or_parse_failed: "Couldn't fetch or read the invoice",
}

function skipReasonLabel(reason: string): string {
  return SKIP_REASON_LABEL[reason] ?? reason
}

export function ExportsHistoryClient() {
  const { markReadyViewed } = useExports()
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  // Opening the Exports page counts as seeing the finished exports — clear the
  // nav badge. Empty deps: only on mount.
  useEffect(() => {
    markReadyViewed()
  }, [markReadyViewed])

  const query = useQuery({
    queryKey: ["exports-history"],
    queryFn: fetchExportsHistory,
    // Refresh periodically so QUEUED/BUILDING rows flip to READY without a reload.
    refetchInterval: 5000,
  })

  const exports = query.data ?? []

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (query.isLoading) {
    return <div className="text-text-secondary text-small">Loading exports…</div>
  }
  if (query.isError) {
    return <div className="text-destructive text-small">Failed to load exports.</div>
  }
  if (exports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary text-small">
        No exports yet. Create one from the Invoices page.
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-sm font-bold uppercase tracking-tight text-text-secondary bg-background">
            <th className="px-3.5 py-2.5">Format</th>
            <th className="px-3.5 py-2.5">Date range</th>
            <th className="px-3.5 py-2.5">Created</th>
            <th className="px-3.5 py-2.5">Status</th>
            <th className="px-3.5 py-2.5 text-right">Download</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hover">
          {exports.map((e) => {
            const className = STATUS_STYLE[e.status].className
            const open = openIds.has(e.id)
            return (
              <RowGroup key={e.id} open={open} onToggle={() => toggle(e.id)} item={e} className={className} />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RowGroup({
  item: e,
  open,
  onToggle,
  className,
}: {
  item: ExportHistoryItem
  open: boolean
  onToggle: () => void
  className: string
}) {
  return (
    <>
      <tr className={cn("hover:bg-[#FAFBFF] cursor-pointer", className)} onClick={onToggle}>
        <td className="px-4 py-3 text-text-secondary align-middle">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </td>
        <td className="px-4 py-3 font-semibold text-text-primary">{e.format}</td>
        <td className="px-4 py-3 text-text-secondary">
          {formatDate(new Date(e.dateRangeStart), "dd MMM yyyy")} –{" "}
          {formatDate(new Date(e.dateRangeEnd), "dd MMM yyyy")}
        </td>
        <td className="px-4 py-3 text-text-secondary">
          {formatDate(new Date(e.createdAt), "dd MMM yyyy, HH:mm")}
        </td>
        <td className="px-4 py-3">
          <span
            className="inline-flex items-center px-2.25 py-0.75 rounded-full text-sm font-semibold"
          >
            {STATUS_STYLE[e.status].label}
          </span>
          {e.skippedCount > 0 && (
            <span className="ml-2 text-sm text-text-secondary">{e.skippedCount} skipped</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <Button
            variant="outline"
            size="sm"
            disabled={e.status !== "READY"}
            onClick={(event) => {
              event.stopPropagation()
              downloadExport(e.id)
            }}
            className="gap-1.5"
          >
            <Download size={14} />
            Download
          </Button>
        </td>
      </tr>
      {open && (
        <tr className="bg-[#FAFBFF]">
          <td />
          <td colSpan={5} className="px-4 py-4">
            <ExportDetail item={e} />
          </td>
        </tr>
      )}
    </>
  )
}

function ExportDetail({ item: e }: { item: ExportHistoryItem }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-3.5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <Detail label="Invoices" value={`${e.invoiceCount}`} />
        <Detail label="Skipped" value={`${e.skippedCount}`} />
        <Detail label="File" value={e.fileName ?? "—"} />
        <Detail
          label="Expires"
          value={e.expiresAt ? formatDate(new Date(e.expiresAt), "dd MMM yyyy") : "—"}
        />
      </dl>

      {e.skipped.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-bold uppercase tracking-tight text-text-secondary">
            Skipped files
          </p>
          <ul className="flex flex-col gap-1">
            {e.skipped.map((s, i) => (
              <li
                key={`${s.invoiceId}-${i}`}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="truncate font-semibold text-text-primary">
                  {s.vendorName ?? "Unknown vendor"}
                </span>
                <span className="shrink-0 text-text-secondary">{skipReasonLabel(s.reason)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {e.status === "READY" && (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadExport(e.id)}
            className="gap-1.5"
          >
            <Download size={14} />
            Download
          </Button>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm font-semibold uppercase tracking-tight text-text-secondary">
        {label}
      </dt>
      <dd className="truncate text-text-primary">{value}</dd>
    </div>
  )
}
