// Client component by import — only ever rendered from <ReconcileClient>.
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { invoiceLabel } from "@/components/reconcile/helpers"
import type { TransactionRow } from "@/components/reconcile/types"

export function MatchedInvoiceCell({ txn }: { txn: TransactionRow }) {
  const inv = invoiceLabel(txn)

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={cn(
            "text-sm font-semibold truncate",
            inv.muted ? "text-dim" : "text-foreground",
          )}
        >
          {inv.text}
        </span>
        {txn.aiSuggested && (
          <span
            className="inline-flex items-center gap-[3px] rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary shrink-0"
            title="Suggested by AI — please review"
          >
            <Sparkles size={10} aria-hidden />
            AI
          </span>
        )}
      </div>
      {txn.matchReason && (
        <div className="text-xs text-dim truncate">{txn.matchReason}</div>
      )}
    </div>
  )
}
