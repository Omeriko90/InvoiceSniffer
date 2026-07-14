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
  accountFilter,
  onAccountChange,
  accounts,
  uiState,
  onUiStateChange,
  count,
}: {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  accountFilter: string
  onAccountChange: (value: string) => void
  accounts: { email: string; label: string }[]
  uiState: UIState
  onUiStateChange: (value: UIState) => void
  count: number
}) {
  // Only worth showing once there's more than one mailbox to filter by.
  const accountOptions = [
    { value: "all", label: "All accounts" },
    ...accounts.map((a) => ({ value: a.email, label: a.label })),
  ]
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative" style={{ maxWidth: "340px", flex: "1 1 220px" }}>
        <Search size={14} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search vendor, amount, invoice #…"
          className="h-auto pl-[34px] pr-3 py-[8px] text-[13.5px] text-text-primary border-[#E8EDFA] rounded-[10px] bg-white"
        />
      </div>

      {/* Status filter */}
      <div className="relative flex items-center gap-2">
      <span className="text-sm font-medium text-text-primary">Status:</span>
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
      </div>

      {/* Source mailbox filter — only when the org has more than one account */}
      {accounts.length > 1 && (
        <Select
          items={accountOptions}
          value={accountFilter}
          onValueChange={(v) => onAccountChange(v as string)}
        >
          <SelectTrigger className="h-auto py-[8px] rounded-[10px] border-[#E8EDFA] bg-white text-[13px] font-[600] text-text-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {accountOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <span className="text-[13px] font-[500] text-[#94A3B8] shrink-0">
        {count} detected
      </span>
    </div>
  )
}
