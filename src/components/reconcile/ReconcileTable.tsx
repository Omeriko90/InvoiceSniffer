// Client component by import — only ever rendered from <ReconcileClient>.
import { EmptyState } from "@/components/reconcile/EmptyState"
import { ReconcileRow } from "@/components/reconcile/ReconcileRow"
import { GRID } from "@/components/reconcile/constants"
import type { RunAction, TransactionRow } from "@/components/reconcile/types"

export function ReconcileTable({
  transactions,
  filtered,
  pending,
  onOpen,
  onFind,
  onRun,
}: {
  transactions: TransactionRow[]
  filtered: TransactionRow[]
  pending: (id: string) => boolean
  onOpen: (txn: TransactionRow) => void
  onFind: (txn: TransactionRow) => void
  onRun: (id: string, action: RunAction) => void
}) {
  return (
    <div className="bg-card border border-border rounded-[14px] overflow-hidden">
      {/* Header */}
      <div className="grid px-[18px] py-[12px] bg-[#F8FAFF] border-b border-border" style={GRID}>
        {["Date", "Merchant", "Amount", "Matched invoice", "Confidence", "Actions"].map((h, i) => (
          <span
            key={h}
            className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-text-secondary"
            style={i === 2 || i === 5 ? { textAlign: "right" } : undefined}
          >
            {h}
          </span>
        ))}
      </div>

      {transactions.length === 0 && <EmptyState />}

      {transactions.length > 0 && filtered.length === 0 && (
        <div className="py-12 text-center text-[13.5px] text-dim">
          No transactions in this view
        </div>
      )}

      {filtered.map((txn) => (
        <ReconcileRow
          key={txn.id}
          txn={txn}
          pending={pending(txn.id)}
          onOpen={onOpen}
          onFind={onFind}
          onRun={onRun}
        />
      ))}
    </div>
  )
}
