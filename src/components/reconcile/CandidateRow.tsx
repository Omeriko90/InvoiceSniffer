// Client component by import — only ever rendered from <FindInvoiceModal>.
import { ConfidenceBar } from "@/components/ui/confidence-bar"
import { ActionButton } from "@/components/reconcile/ActionButton"
import { fmtMoney } from "@/lib/money"
import { fmtDateShort } from "@/lib/date"
import type { CandidateResult } from "@/api-types/reconcile"

export function CandidateRow({
  candidate,
  disabled,
  onLink,
}: {
  candidate: CandidateResult
  disabled: boolean
  onLink: () => void
}) {
  const c = candidate
  return (
    <div className="flex items-center gap-3 border border-border rounded-[11px] px-[13px] py-[11px]">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {c.vendorName ?? "Unknown vendor"}
          {c.invoiceNumber && (
            <span className="text-dim font-mono font-medium"> — {c.invoiceNumber}</span>
          )}
        </p>
        <p className="text-xs text-dim truncate">
          {fmtMoney(c.amount, c.currency)} · {fmtDateShort(c.date)} · {c.reason}
        </p>
      </div>
      {c.confidence !== null && (
        <ConfidenceBar value={c.confidence} className="w-[86px] shrink-0" />
      )}
      <ActionButton variant="blue" disabled={disabled} onClick={onLink}>
        Link
      </ActionButton>
    </div>
  )
}
