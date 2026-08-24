"use client"

import { useState, useMemo } from "react"
import { Sheet } from "@/components/ui/sheet"
import { Dialog } from "@/components/ui/dialog"
import type { InvoiceRow, UIState } from "./types"
import type { ExportFormat } from "@/api/exports"
import { belongsToDate } from "./helpers"
import { InvoicesToolbar } from "./InvoicesToolbar"
import { InvoicesTable } from "./InvoicesTable"
import { InvoiceDetailDrawer } from "./InvoiceDetailDrawer"
import { ExportDialog } from "./ExportDialog"
import { DateRangeDialog } from "./DateRangeDialog"
import { isPreset, resolveInvoiceDateRange, type InvoiceDateScope } from "@/lib/invoice-date-filter"

export function InvoicesClient({ invoices }: { invoices: InvoiceRow[] }) {
  const [search, setSearch]         = useState("")
  const [categoryFilter, setCategory] = useState<string[]>([])
  const [documentTypeFilter, setDocumentType] = useState<string>("all")
  const [accountFilter, setAccount] = useState<string>("all")
  const [dateScope, setDateScope]   = useState<InvoiceDateScope>({ preset: "thisMonth" })
  const [customDateOpen, setCustomDateOpen] = useState(false)
  const [uiState, setUiState]       = useState<UIState>("data")
  const [selected, setSelected]     = useState<InvoiceRow | null>(null)
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null)

  // Distinct source mailboxes present in the data — drives the account filter.
  const accounts = useMemo(() => {
    const map = new Map<string, string>() // email -> label ?? email
    for (const inv of invoices) {
      if (inv.sourceAccount) map.set(inv.sourceAccount.email, inv.sourceAccount.label ?? inv.sourceAccount.email)
    }
    return Array.from(map, ([email, label]) => ({ email, label }))
  }, [invoices])

  // The baseline (unfiltered) view: no search, all categories/accounts, current
  // month. "Clear all" resets to this and is disabled while already here.
  const canClear =
    search !== "" ||
    categoryFilter.length > 0 ||
    documentTypeFilter !== "all" ||
    accountFilter !== "all" ||
    !(isPreset(dateScope) && dateScope.preset === "thisMonth")

  function clearAll() {
    setSearch("")
    setCategory([])
    setDocumentType("all")
    setAccount("all")
    setDateScope({ preset: "thisMonth" })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const range = resolveInvoiceDateRange(dateScope, new Date())
    return invoices.filter((inv) => {
      const matchSearch =
        !q ||
        (inv.vendorName ?? "").toLowerCase().includes(q) ||
        (inv.invoiceNumber ?? "").toLowerCase().includes(q) ||
        inv.totalAmount.includes(q)
      const matchCategory =
        categoryFilter.length === 0 || categoryFilter.includes(inv.category)
      const matchDocumentType =
        documentTypeFilter === "all" || inv.documentType === documentTypeFilter
      const matchAccount =
        accountFilter === "all" || inv.sourceAccount?.email === accountFilter
      const matchDate = (() => {
        if (!range) return true
        const d = belongsToDate(inv)
        return d >= range.from && d <= range.to
      })()
      return matchSearch && matchCategory && matchDocumentType && matchAccount && matchDate
    })
  }, [invoices, search, categoryFilter, documentTypeFilter, accountFilter, dateScope])

  return (
    <div className="flex flex-col gap-4">
      <InvoicesToolbar
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategory}
        documentTypeFilter={documentTypeFilter}
        onDocumentTypeChange={setDocumentType}
        accountFilter={accountFilter}
        onAccountChange={setAccount}
        accounts={accounts}
        dateScope={dateScope}
        onDateScopeChange={setDateScope}
        onOpenCustomDate={() => requestAnimationFrame(() => setCustomDateOpen(true))}
        canClear={canClear}
        onClearAll={clearAll}
        onExport={setExportFormat}
        count={filtered.length}
      />

      <InvoicesTable
        uiState={uiState}
        invoices={invoices}
        filtered={filtered}
        onSelect={setSelected}
      />

      {/* Custom date-range dialog */}
      <Dialog name="invoices_custom_date_range" open={customDateOpen} onOpenChange={setCustomDateOpen}>
        {customDateOpen && (
          <DateRangeDialog
            scope={dateScope}
            onApply={(range) => { setDateScope(range); setCustomDateOpen(false) }}
            onClose={() => setCustomDateOpen(false)}
          />
        )}
      </Dialog>

      {/* Export dialog */}
      <Dialog name="invoices_export" open={!!exportFormat} onOpenChange={(open) => { if (!open) setExportFormat(null) }}>
        {exportFormat && (
          <ExportDialog format={exportFormat} onClose={() => setExportFormat(null)} />
        )}
      </Dialog>

      {/* Drawer */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        {selected && (
          <InvoiceDetailDrawer
            key={selected.id}
            invoice={selected}
            onSaved={setSelected}
            onDismiss={() => setSelected(null)}
          />
        )}
      </Sheet>
    </div>
  )
}
