"use client"

import { useState, useMemo } from "react"
import { Sheet } from "@/components/ui/sheet"
import type { InvoiceRow, UIState } from "./types"
import { InvoicesToolbar } from "./InvoicesToolbar"
import { InvoicesTable } from "./InvoicesTable"
import { InvoiceDetailDrawer } from "./InvoiceDetailDrawer"

export function InvoicesClient({ invoices }: { invoices: InvoiceRow[] }) {
  const [search, setSearch]       = useState("")
  const [statusFilter, setStatus] = useState<string>("all")
  const [uiState, setUiState]     = useState<UIState>("data")
  const [selected, setSelected]   = useState<InvoiceRow | null>(null)

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
      return matchSearch && matchStatus
    })
  }, [invoices, search, statusFilter])

  return (
    <div className="flex flex-col gap-4">
      <InvoicesToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatus}
        uiState={uiState}
        onUiStateChange={setUiState}
        count={filtered.length}
      />

      <InvoicesTable
        uiState={uiState}
        invoices={invoices}
        filtered={filtered}
        onSelect={setSelected}
      />

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
