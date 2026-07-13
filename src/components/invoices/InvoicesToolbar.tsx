// Client component by import — only ever rendered from <InvoicesClient>.
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STATUS_OPTIONS } from "./constants"
import type { UIState } from "./types"

export function InvoicesToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  uiState,
  onUiStateChange,
  count,
}: {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  uiState: UIState
  onUiStateChange: (value: UIState) => void
  count: number
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative" style={{ maxWidth: "340px", flex: "1 1 220px" }}>
        <Search size={14} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search vendor, amount, invoice #…"
          className="h-auto pl-[34px] pr-3 py-[8px] text-[13.5px] text-text-primary border-[#E8EDFA] rounded-[10px] bg-background"
        />
      </div>

      {/* Status filter */}
      <Select
        items={STATUS_OPTIONS}
        value={statusFilter}
        onValueChange={(v) => onStatusChange(v as string)}
      >
        <SelectTrigger className="h-auto py-[8px] rounded-[10px] border-[#E8EDFA] bg-white text-[13px] font-[600] text-text-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* UI state tabs (dev helper) */}
      <div className="flex items-center gap-[3px] bg-white border border-[#E8EDFA] rounded-[9px] p-[3px] ml-auto">
        {(["data", "loading", "empty"] as UIState[]).map((s) => (
          <button
            key={s}
            onClick={() => onUiStateChange(s)}
            className="px-[7px] py-[7px] rounded-[7px] text-[12px] font-[600] capitalize transition-colors"
            style={{
              background: uiState === s ? "#EEF3FF" : "transparent",
              color: uiState === s ? "#3B6FE0" : "#94A3B8",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <span className="text-[13px] font-[500] text-[#94A3B8] shrink-0">
        {count} detected
      </span>
    </div>
  )
}
