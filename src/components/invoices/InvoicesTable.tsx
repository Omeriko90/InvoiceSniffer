// Client component by import — only ever rendered from <InvoicesClient>.
import { TABLE_GRID_COLUMNS } from "./constants"
import type { InvoiceRow as InvoiceRowType, UIState } from "./types"
import { InvoiceRow } from "./InvoiceRow"
import { InvoicesLoading } from "./InvoicesLoading"
import { EmptyState } from "./EmptyState"

export function InvoicesTable({
  uiState,
  invoices,
  filtered,
  onSelect,
}: {
  uiState: UIState
  invoices: InvoiceRowType[]
  filtered: InvoiceRowType[]
  onSelect: (invoice: InvoiceRowType) => void
}) {
  return (
    <div className="bg-white border border-border rounded-[14px] overflow-hidden">
      {/* Header */}
      <div
        className="grid px-4 py-3 bg-surface border-b border-border"
        style={{ gridTemplateColumns: TABLE_GRID_COLUMNS, gap: "12px" }}
      >
        {["Vendor", "Invoice #", "Issue date", "Received", "Status", "Category", "Amount", ""].map((h, i) => (
          <span
            key={i}
            className="text-sm font-bold uppercase tracking-tight text-text-secondary"
            style={i === 6 ? { textAlign: "right" } : undefined}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Body */}
      {uiState === "loading" && Array.from({ length: 6 }).map((_, i) => <InvoicesLoading key={i} />)}

      {uiState === "empty" && <EmptyState />}

      {uiState === "data" && filtered.length === 0 && (
        <div className="py-12 text-center text-[13.5px] text-dim">
          {invoices.length === 0 ? <EmptyState /> : "No results match your search"}
        </div>
      )}

      {uiState === "data" && filtered.map((inv) => (
        <InvoiceRow key={inv.id} invoice={inv} onSelect={onSelect} />
      ))}
    </div>
  )
}
