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
    <div className="bg-white border border-[#E8EDFA] rounded-[14px] overflow-hidden">
      {/* Header */}
      <div
        className="grid px-[18px] py-[12px] bg-[#F8FAFF] border-b border-[#E8EDFA]"
        style={{ gridTemplateColumns: TABLE_GRID_COLUMNS, gap: "12px" }}
      >
        {["Vendor", "Invoice #", "Amount", "Date", "Confidence", "Status", ""].map((h, i) => (
          <span
            key={i}
            className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-[#64748B]"
            style={i === 2 ? { textAlign: "right" } : undefined}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Body */}
      {uiState === "loading" && Array.from({ length: 6 }).map((_, i) => <InvoicesLoading key={i} />)}

      {uiState === "empty" && <EmptyState />}

      {uiState === "data" && filtered.length === 0 && (
        <div className="py-12 text-center text-[13.5px] text-[#94A3B8]">
          {invoices.length === 0 ? <EmptyState /> : "No results match your search"}
        </div>
      )}

      {uiState === "data" && filtered.map((inv) => (
        <InvoiceRow key={inv.id} invoice={inv} onSelect={onSelect} />
      ))}
    </div>
  )
}
