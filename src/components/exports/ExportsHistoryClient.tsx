"use client"

import { useQuery } from "@tanstack/react-query"
import { format as formatDate } from "date-fns"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchExportsHistory, downloadExport, type ExportHistoryItem } from "@/api/exports"

const STATUS_STYLE: Record<ExportHistoryItem["status"], { label: string; bg: string; color: string }> = {
  QUEUED: { label: "Queued", bg: "#F1F3F8", color: "#64748B" },
  BUILDING: { label: "Building…", bg: "#FEF6E7", color: "#B7791F" },
  READY: { label: "Ready", bg: "#E7F6EC", color: "#1A9C4E" },
  EXPIRED: { label: "Expired", bg: "#F1F3F8", color: "#94A3B8" },
  FAILED: { label: "Failed", bg: "#FDECEC", color: "#D64545" },
}

export function ExportsHistoryClient() {
  const query = useQuery({
    queryKey: ["exports-history"],
    queryFn: fetchExportsHistory,
    // Refresh periodically so QUEUED/BUILDING rows flip to READY without a reload.
    refetchInterval: 5000,
  })

  const exports = query.data ?? []

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
            return (
              <tr key={e.id} className="hover:bg-[#FAFBFF]">
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
                    <span className="ml-[8px] text-[12px] text-text-secondary">
                      {e.skippedCount} skipped
                    </span>
                  )}
                </td>
                <td className="px-[16px] py-[12px] text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={e.status !== "READY"}
                    onClick={() => downloadExport(e.id)}
                    className="gap-[6px]"
                  >
                    <Download size={14} />
                    Download
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
