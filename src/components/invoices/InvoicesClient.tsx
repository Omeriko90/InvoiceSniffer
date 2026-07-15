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

export function InvoicesClient({ invoices }: { invoices: InvoiceRow[] }) {
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatus]   = useState<string>("all")
  const [accountFilter, setAccount] = useState<string>("all")
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return invoices.filter((inv) => {
      const matchSearch =
        !q ||
        (inv.vendorName ?? "").toLowerCase().includes(q) ||
        (inv.invoiceNumber ?? "").toLowerCase().includes(q) ||
        inv.totalAmount.includes(q)
      const matchStatus =
        statusFilter === "all" || inv.status === statusFilter
      const matchAccount =
        accountFilter === "all" || inv.sourceAccount?.email === accountFilter
      return matchSearch && matchStatus && matchAccount
    })
  }, [invoices, search, statusFilter, accountFilter])

  return (
    <div className="flex flex-col gap-4">
      <InvoicesToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatus}
        accountFilter={accountFilter}
        onAccountChange={setAccount}
        accounts={accounts}
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
