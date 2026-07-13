// Client component by import — only ever rendered from <ReconcileClient>.
import { invoiceLabel } from "@/components/reconcile/helpers"
import type { TransactionRow } from "@/components/reconcile/types"

export function MatchedInvoiceCell({ txn }: { txn: TransactionRow }) {
  const inv = invoiceLabel(txn)

  return (
    <div className="min-w-0">
      <div
        className="text-[13px] font-[600] truncate"
        style={{ color: inv.muted ? "#94A3B8" : "#334155" }}
      >
        {inv.text}
      </div>
      {txn.matchReason && (
        <div className="text-[11.5px] text-dim truncate">{txn.matchReason}</div>
      )}
    </div>
  )
}
