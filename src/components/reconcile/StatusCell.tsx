// Client component by import — only ever rendered from <ReconcileClient>.
import { Sparkles } from "lucide-react"
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
      <div className="flex items-center gap-[6px]">
        <StatusBadge status={txn.status} confirmed={txn.matchConfirmed} />
        {txn.aiSuggested && (
          <span
            className="inline-flex items-center gap-[3px] rounded-full bg-primary/10 px-[6px] py-[2px] text-[10px] font-bold text-primary"
            title="Suggested by AI — please review"
          >
            <Sparkles size={10} aria-hidden />
            AI
          </span>
        )}
      </div>
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
