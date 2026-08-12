"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format as formatDate } from "date-fns"
import { ChevronDown, ChevronRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useExports } from "@/components/exports/ExportsProvider"
import { fetchExportsHistory, downloadExport, type ExportHistoryItem } from "@/api/exports"

const STATUS_STYLE: Record<ExportHistoryItem["status"], { label: string; bg: string; color: string }> = {
  QUEUED: { label: "Queued", bg: "#F1F3F8", color: "#64748B" },
  BUILDING: { label: "Building…", bg: "#FEF6E7", color: "#B7791F" },
  READY: { label: "Ready", bg: "#E7F6EC", color: "#1A9C4E" },
  EXPIRED: { label: "Expired", bg: "#F1F3F8", color: "#94A3B8" },
  FAILED: { label: "Failed", bg: "#FDECEC", color: "#D64545" },
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
    <div className="border border-[#E8EDFA] rounded-[12px] overflow-hidden bg-white">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11.5px] font-[700] uppercase tracking-[0.04em] text-text-secondary bg-[#FAFBFF]">
            <th className="w-[40px] px-[16px] py-[11px]" />
            <th className="px-[16px] py-[11px]">Format</th>
            <th className="px-[16px] py-[11px]">Date range</th>
            <th className="px-[16px] py-[11px]">Created</th>
            <th className="px-[16px] py-[11px]">Status</th>
            <th className="px-[16px] py-[11px] text-right">Download</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F3F8]">
          {exports.map((e) => {
            const style = STATUS_STYLE[e.status]
            const open = openIds.has(e.id)
            return (
              <RowGroup key={e.id} open={open} onToggle={() => toggle(e.id)} item={e} style={style} />
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
  style,
}: {
  item: ExportHistoryItem
  open: boolean
  onToggle: () => void
  style: { label: string; bg: string; color: string }
}) {
  return (
    <>
      <tr className="hover:bg-[#FAFBFF] cursor-pointer" onClick={onToggle}>
        <td className="px-[16px] py-[12px] text-text-secondary align-middle">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </td>
        <td className="px-[16px] py-[12px] font-[600] text-text-primary">{e.format}</td>
        <td className="px-[16px] py-[12px] text-text-secondary">
          {formatDate(new Date(e.dateRangeStart), "dd MMM yyyy")} –{" "}
          {formatDate(new Date(e.dateRangeEnd), "dd MMM yyyy")}
        </td>
        <td className="px-[16px] py-[12px] text-text-secondary">
          {formatDate(new Date(e.createdAt), "dd MMM yyyy, HH:mm")}
        </td>
        <td className="px-[16px] py-[12px]">
          <span
            className="inline-flex items-center px-[9px] py-[3px] rounded-full text-[12px] font-[600]"
            style={{ background: style.bg, color: style.color }}
          >
            {style.label}
          </span>
          {e.skippedCount > 0 && (
            <span className="ml-[8px] text-[12px] text-text-secondary">{e.skippedCount} skipped</span>
          )}
        </td>
        <td className="px-[16px] py-[12px] text-right">
          <Button
            variant="outline"
            size="sm"
            disabled={e.status !== "READY"}
            onClick={(event) => {
              event.stopPropagation()
              downloadExport(e.id)
            }}
            className="gap-[6px]"
          >
            <Download size={14} />
            Download
          </Button>
        </td>
      </tr>
      {open && (
        <tr className="bg-[#FAFBFF]">
          <td />
          <td colSpan={5} className="px-[16px] pb-[16px] pt-[2px]">
            <ExportDetail item={e} />
          </td>
        </tr>
      )}
    </>
  )
}

function ExportDetail({ item: e }: { item: ExportHistoryItem }) {
  return (
    <div className="flex flex-col gap-[12px] rounded-[10px] border border-[#E8EDFA] bg-white p-[14px]">
      <dl className="grid grid-cols-2 gap-x-[24px] gap-y-[8px] text-[12.5px] sm:grid-cols-3">
        <Detail label="Invoices" value={`${e.invoiceCount}`} />
        <Detail label="Skipped" value={`${e.skippedCount}`} />
        <Detail label="File" value={e.fileName ?? "—"} />
        <Detail
          label="Expires"
          value={e.expiresAt ? formatDate(new Date(e.expiresAt), "dd MMM yyyy") : "—"}
        />
      </dl>

      {e.skipped.length > 0 && (
        <div className="flex flex-col gap-[6px]">
          <p className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-text-secondary">
            Skipped files
          </p>
          <ul className="flex flex-col gap-[4px]">
            {e.skipped.map((s, i) => (
              <li
                key={`${s.invoiceId}-${i}`}
                className="flex items-center justify-between gap-[12px] text-[12.5px]"
              >
                <span className="truncate font-[600] text-text-primary">
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
            className="gap-[6px]"
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
    <div className="flex flex-col gap-[2px]">
      <dt className="text-[11px] font-[600] uppercase tracking-[0.04em] text-text-secondary">
        {label}
      </dt>
      <dd className="truncate text-text-primary">{value}</dd>
    </div>
  )
}
