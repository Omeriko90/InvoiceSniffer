// Client component by import — only ever rendered from <InvoicesClient>.
import { Search, Download, ChevronDown, CalendarDays, SlidersHorizontal } from "lucide-react"
import { format as formatDate } from "date-fns"
import { Input } from "@/components/ui/input"
import { FilterSelect } from "@/components/ui/filter-select"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CATEGORY_LABELS, INVOICE_CATEGORIES } from "@/lib/invoice-categories"
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_SELECTABLE } from "@/lib/document-types"
import type { ExportFormat } from "@/api/exports"
import {
  INVOICE_DATE_PRESETS,
  INVOICE_DATE_PRESET_LABELS,
  isPreset,
  type InvoiceDateScope,
} from "@/lib/invoice-date-filter"

const CATEGORY_OPTIONS = INVOICE_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))

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

interface InvoicesToolbarProps {
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
  onExport: (format: ExportFormat) => void
  count: number
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
  count,
  onExport,
}: InvoicesToolbarProps) {
  const showAccount = accounts.length > 1
  const accountOptions = [
    { value: "all", label: "All accounts" },
    ...accounts.map((a) => ({ value: a.email, label: a.label })),
  ]
  
  const activeCount =
    (categoryFilter.length > 0 ? 1 : 0) +
    (documentTypeFilter !== "all" ? 1 : 0) +
    (showAccount && accountFilter !== "all" ? 1 : 0)

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative" style={{ maxWidth: "340px", flex: "1 1 220px" }}>
        <Search size={14} className="absolute start-[11px] top-1/2 -translate-y-1/2 text-dim" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search vendor, amount, invoice #…"
          className="h-auto ps-8.5 pe-3 py-2 text-sm text-text-primary border-border rounded-[10px] bg-surface"
        />
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

      {/* Filters popover — Status, Category, Type, and (when relevant) Account */}
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="h-auto py-2 rounded-[10px] border-border bg-surface text-sm font-semibold text-text-primary gap-1.5"
            >
              <SlidersHorizontal size={14} className="text-dim" />
              Filters
              {activeCount > 0 && (
                <span className="ms-0.5 inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-primary text-white text-[11px] font-bold leading-none">
                  {activeCount}
                </span>
              )}
              <ChevronDown size={14} className="text-dim" />
            </Button>
          }
        />
        <PopoverContent align="start" className="w-64 gap-4.5">
          <FilterSelect
            label="Category"
            multiple
            options={CATEGORY_OPTIONS}
            value={categoryFilter}
            onChange={onCategoryChange}
            allLabel="All categories"
          />

          <FilterSelect
            label="Type"
            options={DOCUMENT_TYPE_OPTIONS}
            value={documentTypeFilter}
            onChange={onDocumentTypeChange}
          />

          {showAccount && (
            <FilterSelect
              label="Account"
              options={accountOptions}
              value={accountFilter}
              onChange={onAccountChange}
            />
          )}
        </PopoverContent>
      </Popover>

      {canClear && (
        <Button variant="ghost" onClick={onClearAll}>
          Clear all
        </Button>
      )}

      {/* Status + Export pinned right, so the toggling Clear all button on the
          left doesn't shift the "N detected" count. */}
      <div className="ms-auto flex items-center gap-3 shrink-0">
        <span className="text-sm font-medium text-dim">
          {count} detected
        </span>

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
