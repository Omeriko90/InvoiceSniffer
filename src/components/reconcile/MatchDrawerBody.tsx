// Client component by import — only ever rendered from <MatchDrawer>.
import { ArrowDown, CreditCard, ExternalLink, FileText } from "lucide-react"
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ConfidenceBar } from "@/components/ui/confidence-bar"
import { ActionButton } from "@/components/reconcile/ActionButton"
import { Field } from "@/components/reconcile/Field"
import { Panel } from "@/components/reconcile/Panel"
import { CheckChip } from "@/components/reconcile/CheckChip"
import { fmtDate } from "@/components/reconcile/helpers"
import { fmtMoney } from "@/lib/money"
import type { RunAction, TransactionRow } from "@/components/reconcile/types"

export function MatchDrawerBody({
  transaction,
  onRun,
  onFind,
  pending,
}: {
  transaction: TransactionRow
  onRun: (id: string, action: RunAction) => void
  onFind: (txn: TransactionRow) => void
  pending: boolean
}) {
  const { invoice } = transaction
  const showConfidence =
    transaction.matchConfidence !== null &&
    (transaction.status === "MATCHED" || transaction.status === "POSSIBLE")

  // Match signal — do the two sides agree on amount / date?
  const amountMatch = invoice
    ? Math.abs(Number(transaction.amount) - Number(invoice.amount)) < 0.01
    : false

  return (
    <>
      <SheetHeader className="px-[22px] pt-[20px] pb-[16px] border-b border-hover">
        <SheetTitle className="text-[16px] font-[700] text-heading">
          {invoice ? "Confirm this match" : "Transaction detail"}
        </SheetTitle>
        <SheetDescription className="text-[12.5px] text-text-secondary">
          {invoice
            ? "Check that the invoice matches this charge before confirming."
            : "No invoice is linked to this charge yet."}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-[22px] py-[18px] flex flex-col gap-[16px]">
        {/* Confidence banner */}
        {showConfidence && (
          <div className="flex items-center gap-[10px] bg-[#F8FAFF] border border-border rounded-[11px] px-[14px] py-[11px]">
            <div className="flex-1">
              <p className="text-[11px] font-[700] uppercase tracking-[0.05em] text-text-secondary mb-[5px]">
                Match confidence
              </p>
              <ConfidenceBar value={transaction.matchConfidence!} size="md" />
            </div>
          </div>
        )}
        {transaction.matchReason && (
          <p className="text-[12.5px] text-text-secondary -mt-[8px]">
            {transaction.matchReason}
          </p>
        )}

        {/* Side-by-side comparison */}
        <div className="flex flex-col flex-1 items-stretch gap-[12px]">
          <Panel
            icon={<CreditCard size={16} className="text-white" />}
            title="Bank charge"
            subtitle={transaction.sourceFile ?? "Imported transaction"}
            accent="#7AA7FF"
          >
            <Field label="Merchant" value={transaction.merchant} />
            <Field label="Amount" value={fmtMoney(transaction.amount, transaction.currency)} />
            <Field label="Date" value={fmtDate(transaction.date)} />
            <Field label="Currency" value={transaction.currency} />
          </Panel>

          <div className="hidden sm:flex items-center justify-center shrink-0">
            <div className="w-[28px] h-[28px] rounded-full bg-[#EEF3FF] flex items-center justify-center">
              <ArrowDown size={15} className="text-primary" />
            </div>
          </div>

          {invoice ? (
            <Panel
              icon={<FileText size={16} className="text-white" />}
              title={invoice.vendorName ?? "Unknown vendor"}
              subtitle={invoice.senderEmail}
              accent="#34D399"
            >
              <Field
                label="Invoice #"
                value={invoice.invoiceNumber ?? "—"}
                muted={!invoice.invoiceNumber}
              />
              <Field label="Amount" value={fmtMoney(invoice.amount, invoice.currency)} />
              <Field label="Invoice date" value={fmtDate(invoice.date)} />
              <Field
                label="Due date"
                value={invoice.dueDate ? fmtDate(invoice.dueDate) : "—"}
                muted={!invoice.dueDate}
              />
            </Panel>
          ) : (
            <div className="flex-1 border border-dashed border-border rounded-[13px] flex flex-col items-center justify-center py-[28px] px-[16px] text-center">
              <FileText size={22} strokeWidth={1.5} className="text-faint mb-[8px]" />
              <p className="text-[13px] font-[600] text-dim">No invoice linked</p>
            </div>
          )}
        </div>

        {/* Match checks */}
        {invoice && (
          <div className="flex flex-wrap gap-[8px]">
            <CheckChip ok={amountMatch} label={amountMatch ? "Amounts match" : "Amounts differ"} />
            {transaction.currency !== invoice.currency && (
              <CheckChip ok={false} label="Currencies differ" />
            )}
          </div>
        )}

        {/* Gmail link */}
        {invoice && (
          <a
            href={invoice.gmailLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[7px] text-[12.5px] font-[600] text-[#3B6FE0] hover:underline w-fit"
          >
            <ExternalLink size={13} />
            View source email
          </a>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-hover px-[22px] py-[16px] flex gap-[8px]">
        {transaction.status === "MATCHED" && !transaction.matchConfirmed && (
          <>
            <ActionButton size="lg" variant="outline" disabled={pending} onClick={() => onRun(transaction.id, "reject")}>
              ✕ Reject match
            </ActionButton>
            <ActionButton size="lg" variant="green" disabled={pending} onClick={() => onRun(transaction.id, "confirm")}>
              ✓ Confirm match
            </ActionButton>
          </>
        )}
        {transaction.status === "MATCHED" && transaction.matchConfirmed && (
          <ActionButton size="lg" variant="outline" disabled={pending} onClick={() => onRun(transaction.id, "undo")}>
            Undo confirmation
          </ActionButton>
        )}
        {transaction.status === "POSSIBLE" && (
          <>
            <ActionButton size="lg" variant="neutral" disabled={pending} onClick={() => onFind(transaction)}>
              Change invoice
            </ActionButton>
            <ActionButton size="lg" variant="blue" disabled={pending} onClick={() => onRun(transaction.id, "confirm")}>
              Confirm match
            </ActionButton>
          </>
        )}
        {transaction.status === "UNMATCHED" && (
          <>
            <ActionButton size="lg" variant="outline" disabled={pending} onClick={() => onRun(transaction.id, "no_invoice")}>
              No invoice needed
            </ActionButton>
            <ActionButton size="lg" variant="blue" disabled={pending} onClick={() => onFind(transaction)}>
              Find invoice
            </ActionButton>
          </>
        )}
        {transaction.status === "NO_INVOICE" && (
          <ActionButton size="lg" variant="outline" disabled={pending} onClick={() => onRun(transaction.id, "undo")}>
            Undo
          </ActionButton>
        )}
      </div>
    </>
  )
}
