// Client component by import — only ever rendered from <InvoicesClient>.
import { TABLE_GRID_COLUMNS } from "./constants"
import { useT } from "@/components/i18n/LocaleProvider"
import type { InvoiceRow as InvoiceRowType } from "./types"
import { InvoiceRow } from "./InvoiceRow"
import { EmptyState } from "./EmptyState"

export function InvoicesTable({
  invoices,
  filtered,
  onSelect,
}: {
  invoices: InvoiceRowType[]
  filtered: InvoiceRowType[]
  onSelect: (invoice: InvoiceRowType) => void
}) {
  const t = useT()
  const headers = [
    t("invoices.table.vendor"),
    t("invoices.table.invoiceNumber"),
    t("invoices.table.issueDate"),
    t("invoices.table.received"),
    t("invoices.table.status"),
    t("invoices.table.category"),
    t("invoices.table.amount"),
    "",
  ]
  return (
    <div className="bg-white border border-border rounded-[14px] overflow-hidden">
      {/* Header */}
      <div
        className="grid px-4 py-3 bg-surface border-b border-border"
        style={{ gridTemplateColumns: TABLE_GRID_COLUMNS, gap: "12px" }}
      >
        {headers.map((h, i) => (
          <span
            key={i}
            className="text-sm font-bold tracking-tight text-text-secondary"
            style={i === 5 ? { textAlign: "right" } : undefined}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Body */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-dim">
          {invoices.length === 0 ? <EmptyState /> : t("invoices.table.noResults")}
        </div>
      ) : (
        filtered.map((inv) => (
          <InvoiceRow key={inv.id} invoice={inv} onSelect={onSelect} />
        ))
      )}
    </div>
  )
}
