// Client component by import — only ever rendered from <InvoicesClient>.
import type { ReactNode } from "react"
import { Search, Download, ChevronDown, CalendarDays, SlidersHorizontal } from "lucide-react"
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
          <FilterField label="Category">
            <Select
              multiple
              items={CATEGORY_OPTIONS}
              value={categoryFilter}
              onValueChange={(v) => onCategoryChange(v as string[])}
            >
              <SelectTrigger className="w-full h-auto py-2.5 rounded-[10px] border-border bg-surface text-sm font-semibold text-text-primary">
                <SelectValue>
                  {(value) => {
                    const v = value as string[]
                    if (v.length === 0) return "All categories"
                    if (v.length === 1)
                      return CATEGORY_OPTIONS.find((o) => o.value === v[0])?.label ?? "1 selected"
                    return `${v.length} selected`
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-fit min-w-(--anchor-width)">
                {CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Type">
            <Select
              items={DOCUMENT_TYPE_OPTIONS}
              value={documentTypeFilter}
              onValueChange={(v) => onDocumentTypeChange(v as string)}
            >
              <SelectTrigger className="w-full h-auto py-2.5 rounded-[10px] border-border bg-surface text-sm font-semibold text-text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-fit min-w-(--anchor-width)">
                {DOCUMENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          {showAccount && (
            <FilterField label="Account">
              <Select
                items={accountOptions}
                value={accountFilter}
                onValueChange={(v) => onAccountChange(v as string)}
              >
                <SelectTrigger className="w-full h-auto py-2.5 rounded-[10px] border-border bg-surface text-sm font-semibold text-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-fit min-w-(--anchor-width)">
                  {accountOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          )}

          <Button
            variant="ghost"
            onClick={onClearAll}
            disabled={!canClear}
            className="h-auto py-2 rounded-[10px] text-sm font-semibold text-text-secondary hover:bg-hover disabled:text-faint"
          >
            Clear all
          </Button>
        </PopoverContent>
      </Popover>

      <span className="text-sm font-medium text-dim shrink-0">
        {count} detected
      </span>

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

// A labelled row inside the Filters popover — label above its control.
function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.04em] text-text-secondary">
        {label}
      </span>
      {children}
    </div>
  )
}
