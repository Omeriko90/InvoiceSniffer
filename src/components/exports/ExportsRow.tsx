"use client"

import { format as formatDate } from "date-fns"
import { ChevronDown, ChevronRight, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  downloadExport,
  type ExportHistoryItem,
} from "@/api/exports"
import { cn } from "@/lib/utils"
import ExportRowDetails from "./ExportRowDetails"

interface ExportsRowProps {
    item: ExportHistoryItem
    statusLabel: string
    open: boolean
    onToggle: () => void
    className: string
    selected: boolean
    onSelect: () => void
    onDelete: () => void
  }

function ExportsRow({
    item,
    statusLabel,
    open,
    onToggle,
    className,
    selected,
    onSelect,
    onDelete,
  }: ExportsRowProps) {
    return (
      <>
        <tr className="hover:bg-[#FAFBFF] cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3" >
          <div className="flex items-center gap-2">
            <div className="flex h-full" onClick={(event) => event.stopPropagation()}>
            <Checkbox checked={selected} onCheckedChange={onSelect} aria-label="Select export" />
          </div>
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </div>
          </td>
          <td className="px-4 py-3 font-semibold text-text-primary">{item.format}</td>
          <td className="px-4 py-3 text-text-secondary">
            {formatDate(new Date(item.dateRangeStart), "dd MMM yyyy")} –{" "}
            {formatDate(new Date(item.dateRangeEnd), "dd MMM yyyy")}
          </td>
          <td className="px-4 py-3 text-text-secondary">
            {formatDate(new Date(item.createdAt), "dd MMM yyyy, HH:mm")}
          </td>
          <td className="px-4 py-3">
            <span
              className={cn(
                "inline-flex items-center px-2.25 py-0.75 rounded-full text-sm font-semibold",
                className
              )}
            >
              {statusLabel}
            </span>
            {item.skippedCount > 0 && (
              <span className="ml-2 text-sm text-text-secondary">{item.skippedCount} skipped</span>
            )}
          </td>
          <td className="px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={item.status !== "READY"}
                onClick={(event) => {
                  event.stopPropagation()
                  downloadExport(item.id)
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
                <ExportRowDetails item={item} />
            </td>
          </tr>
        )}
      </>
    )
  }


  export default ExportsRow;