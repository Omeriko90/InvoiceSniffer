// Client component by import — only ever rendered from <MatchDrawer>.
import { ArrowDown, CreditCard, ExternalLink, FileText, TriangleAlert } from "lucide-react"
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ConfidenceBar } from "@/components/ui/confidence-bar"
import { InfoBox } from "@/components/ui/info-box"
import { ActionButton } from "@/components/reconcile/ActionButton"
import { Field } from "@/components/reconcile/Field"
import { Panel } from "@/components/reconcile/Panel"
import { CheckChip } from "@/components/reconcile/CheckChip"
import { fmtDate } from "@/components/reconcile/helpers"
import { fmtMoney } from "@/lib/money"
import type { RunAction, TransactionRow } from "@/components/reconcile/types"

function Header({ transaction }: { transaction: TransactionRow }) {
  const { invoice } = transaction
  return (
    <>
      <SheetTitle className="text-lg font-bold text-heading">
        {invoice ? "Confirm this match" : "Transaction detail"}
      </SheetTitle>
      <SheetDescription className="text-[12.5px] text-text-secondary">
        {invoice
          ? "Check that the invoice matches this charge before confirming."
          : "No invoice is linked to this charge yet."}
      </SheetDescription>
    </>
  )
}

function Content({ transaction }: { transaction: TransactionRow }) {
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
      <SheetHeader className="px-5.5 py-5 border-b border-hover">
        <SheetTitle className="text-lg font-bold text-heading">
          {invoice ? "Confirm this match" : "Transaction detail"}
        </SheetTitle>
        <SheetDescription className="text-[12.5px] text-text-secondary">
          {invoice
            ? "Check that the invoice matches this charge before confirming."
            : "No invoice is linked to this charge yet."}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-5.5 py-4.5 flex flex-col gap-4">
        {/* Collision: this invoice was already reconciled in an earlier session */}
        {transaction.collision && invoice && (
          <InfoBox
            variant="warning"
            align="start"
            className="border-warning-border"
            icon={<TriangleAlert size={16} className="text-warning-fg shrink-0 mt-px" />}
          >
            <div className="text-sm leading-relaxed text-warning-fg">
              <p className="font-bold">Already reconciled</p>
              <p>
                This invoice was matched
                {invoice.reconciledSourceFile ? ` against ${invoice.reconciledSourceFile}` : ""}
                {invoice.reconciledAt ? ` on ${fmtDate(invoice.reconciledAt)}` : ""}. Confirming
                again may mean a duplicate charge or a re-uploaded statement.
              </p>
            </div>
          </InfoBox>
        )}
      </div>

        {/* Confidence banner */}
        {showConfidence && (
          <InfoBox variant="neutral" className="border-border">
            <div className="flex-1">
              <p className="text-sm font-bold uppercase tracking-tight text-text-secondary mb-1.25">
                Match confidence
              </p>
              <ConfidenceBar value={transaction.matchConfidence!} size="md" />
            </div>
          </InfoBox>
        )}
        {transaction.matchReason && (
          <p className="text-sm text-text-secondary -mt-2">
            {transaction.matchReason}
          </p>
        )}

      {/* Side-by-side comparison */}
      <div className="flex flex-col flex-1 items-stretch gap-3">
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
          <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center">
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
          <div className="flex-1 border border-dashed border-border rounded-lg flex flex-col items-center justify-center py-7 px-4 text-center">
            <FileText size={22} strokeWidth={1.5} className="text-faint mb-2" />
            <p className="text-sm font-semibold text-text-dim">No invoice linked</p>
          </div>
        )}

        {/* Gmail link */}
        {invoice && (
          <a
            href={invoice.gmailLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.75 text-sm font-semibold text-primary hover:underline w-fit"
          >
            <ExternalLink size={13} />
            View source email
          </a>
        )}
      </div>

      {/* Match checks */}
      {invoice && (
        <div className="flex flex-wrap gap-2">
          <CheckChip ok={amountMatch} label={amountMatch ? "Amounts match" : "Amounts differ"} />
          {transaction.currency !== invoice.currency && (
            <CheckChip ok={false} label="Currencies differ" />
          )}
        </div>
      )}

      {invoice && (
        <a
          href={invoice.gmailLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.75 text-sm font-semibold text-primary hover:underline w-fit"
        >
          <ExternalLink size={13} />
          View source email
        </a>
      )}
    </>
  )
}

function Footer({
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
  return (
    <>
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
    </>
  )
}

export const MatchDrawerBody = { Header, Content, Footer }
