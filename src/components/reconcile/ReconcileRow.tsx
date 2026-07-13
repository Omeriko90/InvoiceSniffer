// Client component by import — only ever rendered from <ReconcileClient>.
import { format } from "date-fns"
import { ActionButton } from "@/components/reconcile/ActionButton"
import { StatusCell } from "@/components/reconcile/StatusCell"
import { MatchedInvoiceCell } from "@/components/reconcile/MatchedInvoiceCell"
import { GRID } from "@/components/reconcile/constants"
import { fmtMoney } from "@/lib/money"
import type { RunAction, TransactionRow } from "@/components/reconcile/types"

export function ReconcileRow({
  txn,
  pending,
  onOpen,
  onFind,
  onRun,
}: {
  txn: TransactionRow
  pending: boolean
  onOpen: (txn: TransactionRow) => void
  onFind: (txn: TransactionRow) => void
  onRun: (id: string, action: RunAction) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Review ${txn.merchant} — ${fmtMoney(txn.amount, txn.currency)}`}
      onClick={() => onOpen(txn)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(txn)
        }
      }}
      className="grid items-center px-[18px] py-[14px] border-b border-hover last:border-b-0 hover:bg-background transition-colors cursor-pointer focus:outline-none focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
      style={GRID}
    >
      {/* Date */}
      <span className="text-[13px] text-text-secondary">
        {format(new Date(txn.date), "MMM d")}
      </span>

      {/* Merchant */}
      <span className="text-[13px] font-[600] text-foreground font-mono truncate">
        {txn.merchant}
      </span>

      {/* Amount */}
      <span className="text-[13.5px] font-[700] text-heading text-right">
        {fmtMoney(txn.amount, txn.currency)}
      </span>

      {/* Matched invoice */}
      <MatchedInvoiceCell txn={txn} />

      {/* Confidence */}
      <StatusCell txn={txn} />

      {/* Actions */}
      <div className="flex gap-[6px] justify-end" onClick={(e) => e.stopPropagation()}>
        {txn.status === "MATCHED" && !txn.matchConfirmed && (
          <>
            <ActionButton variant="outline" disabled={pending} onClick={() => onRun(txn.id, "reject")}>
              ✕ Reject
            </ActionButton>
            <ActionButton variant="green" disabled={pending} onClick={() => onRun(txn.id, "confirm")}>
              ✓ Confirm
            </ActionButton>
          </>
        )}
        {txn.status === "MATCHED" && txn.matchConfirmed && (
          <ActionButton variant="outline" disabled={pending} onClick={() => onRun(txn.id, "undo")}>
            Undo
          </ActionButton>
        )}
        {txn.status === "POSSIBLE" && (
          <>
            <ActionButton variant="neutral" disabled={pending} onClick={() => onFind(txn)}>
              Change
            </ActionButton>
            <ActionButton variant="blue" disabled={pending} onClick={() => onRun(txn.id, "confirm")}>
              Confirm
            </ActionButton>
          </>
        )}
        {txn.status === "UNMATCHED" && (
          <>
            <ActionButton variant="outline" disabled={pending} onClick={() => onRun(txn.id, "no_invoice")}>
              No invoice
            </ActionButton>
            <ActionButton variant="find" disabled={pending} onClick={() => onFind(txn)}>
              Find invoice
            </ActionButton>
          </>
        )}
        {txn.status === "NO_INVOICE" && (
          <ActionButton variant="outline" disabled={pending} onClick={() => onRun(txn.id, "undo")}>
            Undo
          </ActionButton>
        )}
      </div>
    </div>
  )
}
