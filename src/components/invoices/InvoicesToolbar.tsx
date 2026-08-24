// Client component by import — only ever rendered from <InvoicesClient>.
import { Search, Download, ChevronDown, CalendarDays } from "lucide-react"
import { format as formatDate } from "date-fns"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CATEGORY_LABELS, INVOICE_CATEGORIES } from "@/lib/invoice-categories"
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_SELECTABLE } from "@/lib/document-types"
import type { UIState } from "./types"
import type { ExportFormat } from "@/api/exports"
import {
  INVOICE_DATE_PRESETS,
  INVOICE_DATE_PRESET_LABELS,
  isPreset,
  type InvoiceDateScope,
} from "@/lib/invoice-date-filter"

const CATEGORY_OPTIONS = [
  { value: "all", label: "All categories" },
  ...INVOICE_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
]

const DOCUMENT_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  ...DOCUMENT_TYPE_SELECTABLE.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABELS[t] })),
]

function dateScopeLabel(scope: InvoiceDateScope): string {
  if (isPreset(scope)) return INVOICE_DATE_PRESET_LABELS[scope.preset]
  const from = new Date(scope.from)
  const to = new Date(scope.to)
  // Drop the start year only when both ends share it; show it when they differ.
  const fromFmt = from.getFullYear() === to.getFullYear() ? "d MMM" : "d MMM yyyy"
  return `${formatDate(from, fromFmt)} – ${formatDate(to, "d MMM yyyy")}`
}

export function InvoicesToolbar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  documentTypeFilter,
  onDocumentTypeChange,
  accountFilter,
  onAccountChange,
  accounts,
  dateScope,
  onDateScopeChange,
  onOpenCustomDate,
  canClear,
  onClearAll,
  uiState,
  onUiStateChange,
  count,
  onExport,
}: {
  search: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryChange: (value: string) => void
  documentTypeFilter: string
  onDocumentTypeChange: (value: string) => void
  accountFilter: string
  onAccountChange: (value: string) => void
  accounts: { email: string; label: string }[]
  dateScope: InvoiceDateScope
  onDateScopeChange: (scope: InvoiceDateScope) => void
  onOpenCustomDate: () => void
  canClear: boolean
  onClearAll: () => void
  uiState: UIState
  onUiStateChange: (value: UIState) => void
  count: number
  onExport: (format: ExportFormat) => void
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
        <Search size={14} className="absolute start-[11px] top-1/2 -translate-y-1/2 text-dim" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search vendor, amount, invoice #…"
          className="h-auto ps-[34px] pe-3 py-2 text-sm text-text-primary border-border rounded-[10px] bg-surface"
        />
      </div>

      {/* Category filter */}
      <div className="relative flex items-center gap-2">
      <span className="text-sm font-medium text-text-primary">Category:</span>
      <Select
        items={CATEGORY_OPTIONS}
        value={categoryFilter}
        onValueChange={(v) => onCategoryChange(v as string)}
      >
        <SelectTrigger className="h-auto py-2 rounded-[10px] border-border bg-surface text-sm font-semibold text-text-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="w-fit min-w-(--anchor-width)">
          {CATEGORY_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      </div>

      {/* Document type filter */}
      <div className="relative flex items-center gap-2">
      <span className="text-sm font-medium text-text-primary">Type:</span>
      <Select
        items={DOCUMENT_TYPE_OPTIONS}
        value={documentTypeFilter}
        onValueChange={(v) => onDocumentTypeChange(v as string)}
      >
        <SelectTrigger className="h-auto py-2 rounded-[10px] border-border bg-surface text-sm font-semibold text-text-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="w-fit min-w-(--anchor-width)">
          {DOCUMENT_TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      </div>

      {/* Date filter */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline">
              <CalendarDays size={14} className="text-dim" />
              {dateScopeLabel(dateScope)}
              <ChevronDown size={14} className="text-dim" />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          {INVOICE_DATE_PRESETS.map((p) => (
            <DropdownMenuItem key={p} onClick={() => onDateScopeChange({ preset: p })}>
              {INVOICE_DATE_PRESET_LABELS[p]}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onOpenCustomDate}>Custom range…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Source mailbox filter — only when the org has more than one account */}
      {accounts.length > 1 && (
        <Select
          items={accountOptions}
          value={accountFilter}
          onValueChange={(v) => onAccountChange(v as string)}
        >
          <SelectTrigger className="h-auto py-2 rounded-[10px] border-border bg-surface text-sm font-semibold text-text-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-fit min-w-(--anchor-width)">
            {accountOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <span className="text-sm font-medium text-dim shrink-0">
        {count} detected
      </span>

      <Button variant="ghost" onClick={onClearAll} disabled={!canClear}>
        Clear all
      </Button>

      <div className="ms-auto shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline">
                <Download size={14} />
                Export
                <ChevronDown size={14} className="text-dim" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport("csv")}>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("xlsx")}>Export as Excel</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("pdf")}>Export as PDF (merged)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
