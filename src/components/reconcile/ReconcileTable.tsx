// Client component by import — only ever rendered from <ReconcileClient>.
import { useT } from "@/components/i18n/LocaleProvider"
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
  const t = useT()
  const headers = [
    { key: "date", label: t("reconcile.table.date") },
    { key: "merchant", label: t("reconcile.table.merchant") },
    { key: "amount", label: t("reconcile.table.amount") },
    { key: "matchedInvoice", label: t("reconcile.table.matchedInvoice") },
    { key: "confidence", label: t("reconcile.table.confidence") },
    { key: "actions", label: t("reconcile.table.actions") },
  ]
  return (
    <div className="bg-card border border-border rounded-[14px] overflow-hidden">
      {/* Header */}
      <div className="grid px-[18px] py-3 bg-raised border-b border-border" style={GRID}>
        {headers.map((h, i) => (
          <span
            key={h.key}
            className="text-xs font-bold text-text-secondary"
            style={i === 2 || i === 4 ? { textAlign: "right" } : undefined}
          >
            {h.label}
          </span>
        ))}
      </div>

      {transactions.length === 0 && <EmptyState />}

      {transactions.length > 0 && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-dim">
          {t("reconcile.table.noTransactions")}
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
