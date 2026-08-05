// Client component by import — only ever rendered from <ReconcileClient>.
import { cn } from "@/lib/utils"
import { invoiceLabel } from "@/components/reconcile/helpers"
import type { TransactionRow } from "@/components/reconcile/types"

export function MatchedInvoiceCell({ txn }: { txn: TransactionRow }) {
  const inv = invoiceLabel(txn)

  return (
    <div className="min-w-0">
      <div
        className={cn(
          "text-sm font-semibold truncate",
          inv.muted ? "text-dim" : "text-foreground",
        )}
      >
        {inv.text}
      </div>
      {txn.matchReason && (
        <div className="text-xs text-dim truncate">{txn.matchReason}</div>
      )}
    </div>
  )
}
