// Client component by import — only ever rendered from <ReconciliationCard>.
import Link from "next/link"
import { AlertCircle, XCircle } from "lucide-react"

export function NeedsAttention({
  possibleCount,
  unmatchedCount,
}: {
  possibleCount: number
  unmatchedCount: number
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-[18px]">
      <p className="text-xs font-bold text-text-secondary uppercase tracking-[0.04em] mb-0.5">
        Needs your attention
      </p>

      {possibleCount > 0 && (
        <Link
          href="/reconcile"
          className="flex items-center gap-3 px-3 py-[11px] rounded-[10px] border border-warning-border bg-warning-bg transition-all hover:brightness-[0.98]"
        >
          <AlertCircle size={18} strokeWidth={2} className="shrink-0 text-warning-fg" />
          <span className="flex-1 text-sm text-warning-fg">
            <strong>{possibleCount} possible matches</strong> waiting for confirmation
          </span>
          <span className="text-sm font-bold text-warning-fg shrink-0">Review →</span>
        </Link>
      )}

      {unmatchedCount > 0 && (
        <Link
          href="/reconcile"
          className="flex items-center gap-3 px-3 py-[11px] rounded-[10px] border border-danger-border bg-danger-bg transition-all hover:brightness-[0.98]"
        >
          <XCircle size={18} strokeWidth={2} className="shrink-0 text-danger-fg" />
          <span className="flex-1 text-sm text-danger-fg">
            <strong>{unmatchedCount} transactions</strong> with no matching invoice
          </span>
          <span className="text-sm font-bold text-danger-fg shrink-0">Review →</span>
        </Link>
      )}

      {possibleCount === 0 && unmatchedCount === 0 && (
        <div className="flex items-center gap-2 px-3 py-[11px] rounded-[10px] border border-success-border bg-success-bg text-sm font-medium text-success-fg">
          <span className="w-2 h-2 rounded-full bg-success shrink-0" />
          All transactions reconciled
        </div>
      )}
    </div>
  )
}
