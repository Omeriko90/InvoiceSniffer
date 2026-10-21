// Client component by import — only ever rendered from <ReconcileClient>.
import { TriangleAlert } from "lucide-react"
import { useT } from "@/components/i18n/LocaleProvider"
import { ActionButton } from "@/components/reconcile/ActionButton"
import { MatchedInvoiceCell } from "@/components/reconcile/MatchedInvoiceCell"
import { GRID } from "@/components/reconcile/constants"
import { fmtMoney } from "@/lib/money"
import { fmtDateShort } from "@/lib/date"
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
  const t = useT()
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t("reconcile.row.reviewAria", { merchant: txn.merchant, amount: fmtMoney(txn.amount, txn.currency) })}
      onClick={() => onOpen(txn)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(txn)
        }
      }}
      className="grid items-center px-[18px] py-3.5 border-b border-hover last:border-b-0 hover:bg-background transition-colors cursor-pointer focus:outline-none focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
      style={GRID}
    >
      {/* Date */}
      <span className="text-sm text-text-secondary">
        {fmtDateShort(txn.date)}
      </span>

      {/* Merchant */}
      <div className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground font-mono truncate">
          {txn.collision && (
            <TriangleAlert size={13} className="text-warning-fg shrink-0" aria-label={t("reconcile.row.alreadyReconciledAria")} />
          )}
          <span className="truncate">{txn.merchant}</span>
        </span>
        {txn.sourceFile && (
          <span className="block text-xs text-dim truncate">{txn.sourceFile}</span>
        )}
      </div>

      {/* Amount */}
      <span className="text-sm font-bold text-heading text-end">
        {fmtMoney(txn.amount, txn.currency)}
      </span>

      {/* Matched invoice */}
      <MatchedInvoiceCell txn={txn} />

      {/* Actions */}
      <div className="flex gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
        {txn.status === "MATCHED" && !txn.matchConfirmed && (
          <>
            <ActionButton variant="outline" disabled={pending} onClick={() => onRun(txn.id, "reject")}>
              ✕ {t("reconcile.rowAction.reject")}
            </ActionButton>
            <ActionButton variant="green" disabled={pending} onClick={() => onRun(txn.id, "confirm")}>
              ✓ {t("reconcile.rowAction.confirm")}
            </ActionButton>
          </>
        )}
        {txn.status === "MATCHED" && txn.matchConfirmed && (
          <ActionButton variant="outline" disabled={pending} onClick={() => onRun(txn.id, "undo")}>
            {t("reconcile.rowAction.undo")}
          </ActionButton>
        )}
        {txn.status === "POSSIBLE" && (
          <>
            <ActionButton variant="neutral" disabled={pending} onClick={() => onFind(txn)}>
              {t("reconcile.rowAction.change")}
            </ActionButton>
            <ActionButton variant="blue" disabled={pending} onClick={() => onRun(txn.id, "confirm")}>
              {t("reconcile.rowAction.confirm")}
            </ActionButton>
          </>
        )}
        {txn.status === "UNMATCHED" && (
          <>
            <ActionButton variant="outline" disabled={pending} onClick={() => onRun(txn.id, "no_invoice")}>
              {t("reconcile.rowAction.noInvoice")}
            </ActionButton>
            <ActionButton variant="find" disabled={pending} onClick={() => onFind(txn)}>
              {t("reconcile.rowAction.findInvoice")}
            </ActionButton>
          </>
        )}
        {txn.status === "NO_INVOICE" && (
          <ActionButton variant="outline" disabled={pending} onClick={() => onRun(txn.id, "undo")}>
            {t("reconcile.rowAction.undo")}
          </ActionButton>
        )}
      </div>
    </div>
  )
}
