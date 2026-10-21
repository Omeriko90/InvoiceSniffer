"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format as formatDate } from "date-fns"
import { ChevronDown, ChevronRight, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useExports } from "@/components/exports/ExportsProvider"
import {
  fetchExportsHistory,
  downloadExport,
  deleteExport,
  deleteExports,
  type ExportHistoryItem,
} from "@/api/exports"
import { cn } from "@/lib/utils"

const STATUS_STYLE: Record<ExportHistoryItem["status"], { label: string; className: string }> = {
  QUEUED: { label: "Queued", className: "bg-hover text-text-secondary" },
  BUILDING: { label: "Building…", className: "bg-warning-bg text-warning-fg" },
  READY: { label: "Ready", className: "bg-success-bg text-success-fg" },
  EXPIRED: { label: "Expired", className: "bg-hover text-dim" },
  FAILED: { label: "Failed", className: "bg-danger-bg text-danger-fg" },
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
  const queryClient = useQueryClient()
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Pending confirmation: a single row to delete, or "bulk" for the selection.
  const [pendingDelete, setPendingDelete] = useState<ExportHistoryItem | "bulk" | null>(null)

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

  const exports = useMemo(() => query.data ?? [], [query.data])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["exports-history"] })

  const singleMutation = useMutation({
    mutationFn: (id: string) => deleteExport(id),
    onSuccess: (_data, id) => {
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setPendingDelete(null)
      invalidate()
    },
  })

  const bulkMutation = useMutation({
    mutationFn: (ids: string[]) => deleteExports(ids),
    onSuccess: () => {
      setSelected(new Set())
      setPendingDelete(null)
      invalidate()
    },
  })

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === exports.length ? new Set() : new Set(exports.map((e) => e.id))))
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

  const allSelected = selected.size === exports.length
  const someSelected = selected.size > 0 && !allSelected
  const isPending = singleMutation.isPending || bulkMutation.isPending

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3.5 py-2">
          <span className="text-sm font-semibold text-text-secondary">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => setPendingDelete("bulk")}
              className="gap-1.5"
            >
              <Trash2 size={14} />
              Delete {selected.size} {selected.size === 1 ? "row" : "rows"}
            </Button>
          </div>
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-sm font-bold tracking-tight text-text-secondary bg-white">
              <th className="px-3.5 py-2.5" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all exports"
                />
              </th>
              <th className="px-3.5 py-2.5" />
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
                <RowGroup
                  key={e.id}
                  open={open}
                  onToggle={() => toggle(e.id)}
                  item={e}
                  className={className}
                  selected={selected.has(e.id)}
                  onSelect={() => toggleSelected(e.id)}
                  onDelete={() => setPendingDelete(e)}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {pendingDelete === "bulk" && (
        <ConfirmationDialog
          open
          onOpenChange={(open) => !open && setPendingDelete(null)}
          destructive
          title={`Delete ${selected.size} ${selected.size === 1 ? "export" : "exports"}?`}
          description="This permanently removes the selected exports and their files."
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          isPending={bulkMutation.isPending}
          onConfirm={() => bulkMutation.mutate(Array.from(selected))}
        />
      )}

      {pendingDelete && pendingDelete !== "bulk" && (
        <ConfirmationDialog
          open
          onOpenChange={(open) => !open && setPendingDelete(null)}
          destructive
          title="Delete export?"
          description={`This permanently removes the ${pendingDelete.format} export from ${formatDate(
            new Date(pendingDelete.dateRangeStart),
            "dd MMM yyyy"
          )} – ${formatDate(new Date(pendingDelete.dateRangeEnd), "dd MMM yyyy")} and its file.`}
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          isPending={singleMutation.isPending}
          onConfirm={() => singleMutation.mutate(pendingDelete.id)}
        />
      )}
    </div>
  )
}

function RowGroup({
  item: e,
  open,
  onToggle,
  className,
  selected,
  onSelect,
  onDelete,
}: {
  item: ExportHistoryItem
  open: boolean
  onToggle: () => void
  className: string
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <>
      <tr className="hover:bg-[#FAFBFF] cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3 align-middle" onClick={(event) => event.stopPropagation()}>
          <Checkbox checked={selected} onCheckedChange={onSelect} aria-label="Select export" />
        </td>
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
            className={cn(
              "inline-flex items-center px-2.25 py-0.75 rounded-full text-sm font-semibold",
              className
            )}
          >
            {STATUS_STYLE[e.status].label}
          </span>
          {e.skippedCount > 0 && (
            <span className="ml-2 text-sm text-text-secondary">{e.skippedCount} skipped</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
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
            <Button
              variant="ghost"
              size="sm"
              aria-label="Delete export"
              onClick={(event) => {
                event.stopPropagation()
                onDelete()
              }}
              className="text-text-secondary hover:text-destructive"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-[#FAFBFF]">
          <td />
          <td colSpan={6} className="px-4 py-4">
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
          <p className="text-sm font-bold tracking-tight text-text-secondary">
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
      <dt className="text-sm font-semibold tracking-tight text-text-secondary">
        {label}
      </dt>
      <dd className="truncate text-text-primary">{value}</dd>
    </div>
  )
}
