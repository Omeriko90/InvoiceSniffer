"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format as formatDate } from "date-fns"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useT, useDateFnsLocale } from "@/components/i18n/LocaleProvider"
import { useExports } from "@/components/exports/ExportsProvider"
import {
  deleteExport,
  deleteExports,
  type ExportHistoryItem,
} from "@/api/exports"
import ExportsRow from "./ExportsRow"
import useGetExportHistory from "@/hooks/exports/useGetExportHistory"

const STATUS_CLASS: Record<ExportHistoryItem["status"], string> = {
  QUEUED: "bg-hover text-text-secondary",
  BUILDING: "bg-warning-bg text-warning-fg",
  READY: "bg-success-bg text-success-fg",
  EXPIRED: "bg-hover text-dim",
  FAILED: "bg-danger-bg text-danger-fg",
}



export function ExportsHistory() {
  const t = useT()
  const dfl = useDateFnsLocale()
  const { markReadyViewed } = useExports()
  const queryClient = useQueryClient()
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pendingDelete, setPendingDelete] = useState<ExportHistoryItem | "bulk" | null>(null)
  const { data: exports = [], isPending: isLoading, isError } = useGetExportHistory()

  useEffect(() => {
    markReadyViewed()
  }, [markReadyViewed])


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

  if (isLoading) {
    return <div className="text-text-secondary text-small">{t("exports.loading")}</div>
  }
  if (isError) {
    return <div className="text-destructive text-small">{t("exports.loadError")}</div>
  }
  if (exports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary text-small">
        {t("exports.empty")}
      </div>
    )
  }

  const allSelected = selected.size === exports.length
  const someSelected = selected.size > 0 && !allSelected
  const isPending = singleMutation.isPending || bulkMutation.isPending
  
  return (
    <div className="flex flex-1 flex-col gap-3 min-h-0">
      {selected.size > 0 && (
        <div className="flex items-center absolute bottom-4 left-1/2 justify-between z-50 shadow-lg gap-8 rounded-lg border border-border bg-white px-3.5 py-2">
          <span className="text-sm font-semibold text-text-secondary">
            {t("exports.selectedCount", { count: selected.size })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setSelected(new Set())}
            >
              {t("exports.clear")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => setPendingDelete("bulk")}
              className="gap-1.5"
            >
              <Trash2 size={14} />
              {t("exports.delete")}
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto border border-border rounded-lg bg-white">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 [&_th]:shadow-[inset_0_-1px_0_0_var(--border)]">
            <tr className="text-start text-sm font-bold tracking-tight text-text-secondary bg-white">
              <th className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label={t("exports.selectAll")}
                />
              </th>
              <th className="px-4 py-3">{t("exports.column.format")}</th>
              <th className="px-4 py-3">{t("exports.column.dateRange")}</th>
              <th className="px-4 py-3">{t("exports.column.created")}</th>
              <th className="px-4 py-3">{t("exports.column.status")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hover">
            {exports.map((e) => {
              const className = STATUS_CLASS[e.status]
              const open = openIds.has(e.id)
              return (
                <ExportsRow
                  key={e.id}
                  item={e}
                  onDelete={() => setPendingDelete(e)}
                  statusLabel={t(`exports.status.${e.status}`)}
                  open={open}
                  onToggle={() => toggle(e.id)}
                  className={className}
                  selected={selected.has(e.id)}
                  onSelect={() => toggleSelected(e.id)}
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
          title={t("exports.deleteDialog.bulkTitle", { count: selected.size })}
          description={t("exports.deleteDialog.bulkDescription")}
          confirmLabel={t("exports.delete")}
          pendingLabel={t("exports.deleting")}
          isPending={bulkMutation.isPending}
          onConfirm={() => bulkMutation.mutate(Array.from(selected))}
        />
      )}

      {pendingDelete && pendingDelete !== "bulk" && (
        <ConfirmationDialog
          open
          onOpenChange={(open) => !open && setPendingDelete(null)}
          destructive
          title={t("exports.deleteDialog.singleTitle")}
          description={t("exports.deleteDialog.singleDescription", {
            format: pendingDelete.format,
            start: formatDate(new Date(pendingDelete.dateRangeStart), "dd MMM yyyy", { locale: dfl }),
            end: formatDate(new Date(pendingDelete.dateRangeEnd), "dd MMM yyyy", { locale: dfl }),
          })}
          confirmLabel={t("exports.delete")}
          pendingLabel={t("exports.deleting")}
          isPending={singleMutation.isPending}
          onConfirm={() => singleMutation.mutate(pendingDelete.id)}
        />
      )}
    </div>
  )
}
