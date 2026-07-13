// Client component by import — only ever rendered from <ReconcileClient>.
import { ConfidenceBar } from "@/components/ui/confidence-bar"
import { StatusBadge, STATUS_META } from "@/components/reconcile/status"
import type { TransactionRow } from "@/components/reconcile/types"

export function StatusCell({ txn }: { txn: TransactionRow }) {
  const meta = STATUS_META[txn.status]
  const showBar =
    txn.matchConfidence !== null &&
    (txn.status === "MATCHED" || txn.status === "POSSIBLE")

  return (
    <div>
      <StatusBadge status={txn.status} confirmed={txn.matchConfirmed} />
      {showBar && (
        <ConfidenceBar
          value={txn.matchConfidence!}
          barClassName={meta.bar}
          className="mt-[5px]"
        />
      )}
    </div>
  )
}
