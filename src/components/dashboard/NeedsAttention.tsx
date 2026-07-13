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
      <p className="text-[12.5px] font-[700] text-text-secondary uppercase tracking-[0.04em] mb-[2px]">
        Needs your attention
      </p>

      {possibleCount > 0 && (
        <Link
          href="/reconcile"
          className="flex items-center gap-3 px-3 py-[11px] rounded-[10px] border transition-all hover:brightness-[0.98]"
          style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}
        >
          <AlertCircle size={18} strokeWidth={2} color="#B45309" className="shrink-0" />
          <span className="flex-1 text-[13.5px] text-[#78350F]">
            <strong>{possibleCount} possible matches</strong> waiting for confirmation
          </span>
          <span className="text-[13px] font-[700] text-[#B45309] shrink-0">Review →</span>
        </Link>
      )}

      {unmatchedCount > 0 && (
        <Link
          href="/reconcile"
          className="flex items-center gap-3 px-3 py-[11px] rounded-[10px] border transition-all hover:brightness-[0.98]"
          style={{ background: "#FEF2F2", borderColor: "#FECACA" }}
        >
          <XCircle size={18} strokeWidth={2} color="#DC2626" className="shrink-0" />
          <span className="flex-1 text-[13.5px] text-[#7F1D1D]">
            <strong>{unmatchedCount} transactions</strong> with no matching invoice
          </span>
          <span className="text-[13px] font-[700] text-[#DC2626] shrink-0">Review →</span>
        </Link>
      )}

      {possibleCount === 0 && unmatchedCount === 0 && (
        <div
          className="flex items-center gap-2 px-3 py-[11px] rounded-[10px] border border-[#BBF7D0] text-[13px] font-[500] text-[#059669]"
          style={{ background: "#ECFDF5" }}
        >
          <span className="w-2 h-2 rounded-full bg-success shrink-0" />
          All transactions reconciled
        </div>
      )}
    </div>
  )
}
