"use client"

import { useState, useMemo } from "react"
import { Sheet } from "@/components/ui/sheet"
import { Dialog } from "@/components/ui/dialog"
import type { InvoiceRow, UIState } from "./types"
import type { ExportFormat } from "@/api/exports"
import { InvoicesToolbar } from "./InvoicesToolbar"
import { InvoicesTable } from "./InvoicesTable"
import { InvoiceDetailDrawer } from "./InvoiceDetailDrawer"
import { ExportDialog } from "./ExportDialog"
import { DateRangeDialog } from "./DateRangeDialog"
import { isPreset, resolveInvoiceDateRange, type InvoiceDateScope } from "@/lib/invoice-date-filter"

export function InvoicesClient({ invoices }: { invoices: InvoiceRow[] }) {
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatus]   = useState<string>("all")
  const [categoryFilter, setCategory] = useState<string>("all")
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

  // The baseline (unfiltered) view: no search, all statuses/accounts, current
  // month. "Clear all" resets to this and is disabled while already here.
  const canClear =
    search !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    accountFilter !== "all" ||
    !(isPreset(dateScope) && dateScope.preset === "thisMonth")

  function clearAll() {
    setSearch("")
    setStatus("all")
    setCategory("all")
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
      const matchStatus =
        statusFilter === "all" || inv.status === statusFilter
      const matchCategory =
        categoryFilter === "all" || inv.category === categoryFilter
      const matchAccount =
        accountFilter === "all" || inv.sourceAccount?.email === accountFilter
      const matchDate = (() => {
        if (!range) return true
        const d = new Date(inv.emailDate)
        return d >= range.from && d <= range.to
      })()
      return matchSearch && matchStatus && matchCategory && matchAccount && matchDate
    })
  }, [invoices, search, statusFilter, categoryFilter, accountFilter, dateScope])

  return (
    <div className="flex flex-col gap-4">
      <InvoicesToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatus}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategory}
        accountFilter={accountFilter}
        onAccountChange={setAccount}
        accounts={accounts}
        dateScope={dateScope}
        onDateScopeChange={setDateScope}
        onOpenCustomDate={() => requestAnimationFrame(() => setCustomDateOpen(true))}
        canClear={canClear}
        onClearAll={clearAll}
        uiState={uiState}
        onUiStateChange={setUiState}
        count={filtered.length}
        onExport={setExportFormat}
      />

      <InvoicesTable
        uiState={uiState}
        invoices={invoices}
        filtered={filtered}
        onSelect={setSelected}
      />

      {/* Custom date-range dialog */}
      <Dialog open={customDateOpen} onOpenChange={setCustomDateOpen}>
        {customDateOpen && (
          <DateRangeDialog
            scope={dateScope}
            onApply={(range) => { setDateScope(range); setCustomDateOpen(false) }}
            onClose={() => setCustomDateOpen(false)}
          />
        )}
      </Dialog>

      {/* Export dialog */}
      <Dialog open={!!exportFormat} onOpenChange={(open) => { if (!open) setExportFormat(null) }}>
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
