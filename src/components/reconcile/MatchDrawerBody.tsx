// Client component by import — only ever rendered from <MatchDrawer>.
import { ArrowDown, CreditCard, ExternalLink, FileText, TriangleAlert } from "lucide-react"
import { useT } from "@/components/i18n/LocaleProvider"
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { InfoBox } from "@/components/ui/info-box"
import { ActionButton } from "@/components/reconcile/ActionButton"
import { Field } from "@/components/reconcile/Field"
import { Panel } from "@/components/reconcile/Panel"
import { CheckChip } from "@/components/reconcile/CheckChip"
import { fmtDate } from "@/components/reconcile/helpers"
import { fmtMoney } from "@/lib/money"
import type { RunAction, TransactionRow } from "@/components/reconcile/types"

function Header({ transaction }: { transaction: TransactionRow }) {
  const t = useT()
  const { invoice } = transaction
  return (
    <>
      <SheetTitle className="text-lg font-bold text-heading">
        {invoice ? t("reconcile.drawer.confirmThisMatch") : t("reconcile.drawer.transactionDetail")}
      </SheetTitle>
      <SheetDescription className="text-[12.5px] text-text-secondary">
        {invoice
          ? t("reconcile.drawer.checkInvoiceMatches")
          : t("reconcile.drawer.noInvoiceLinkedYet")}
      </SheetDescription>
    </>
  )
}

function Content({ transaction }: { transaction: TransactionRow }) {
  const t = useT()
  const { invoice } = transaction

  // Match signal — do the two sides agree on amount / date?
  const amountMatch = invoice
    ? Math.abs(Number(transaction.amount) - Number(invoice.amount)) < 0.01
    : false

  return (
    <>
      <SheetHeader className="px-5.5 py-5 border-b border-hover">
        <SheetTitle className="text-lg font-bold text-heading">
          {invoice ? t("reconcile.drawer.confirmThisMatch") : t("reconcile.drawer.transactionDetail")}
        </SheetTitle>
        <SheetDescription className="text-xs text-text-secondary">
          {invoice
            ? t("reconcile.drawer.checkInvoiceMatches")
            : t("reconcile.drawer.noInvoiceLinkedYet")}
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
              <p className="font-bold">{t("reconcile.collision.title")}</p>
              <p>
                {t("reconcile.collision.matched")}
                {invoice.reconciledSourceFile ? t("reconcile.collision.againstFile", { file: invoice.reconciledSourceFile }) : ""}
                {invoice.reconciledAt ? t("reconcile.collision.onDate", { date: fmtDate(invoice.reconciledAt) }) : ""}
                {t("reconcile.collision.confirmingAgain")}
              </p>
            </div>
          </InfoBox>
        )}
      </div>

        {transaction.matchReason && (
          <p className="text-sm text-text-secondary -mt-2">
            {transaction.matchReason}
          </p>
        )}

      {/* Side-by-side comparison */}
      <div className="flex flex-col flex-1 items-stretch gap-3">
        <Panel
          icon={<CreditCard size={16} className="text-white" />}
          title={t("reconcile.drawer.bankCharge")}
          subtitle={transaction.sourceFile ?? t("reconcile.drawer.importedTransaction")}
          accentClass="bg-primary"
        >
          <Field label={t("reconcile.field.merchant")} value={transaction.merchant} />
          <Field label={t("reconcile.field.amount")} value={fmtMoney(transaction.amount, transaction.currency)} />
          <Field label={t("reconcile.field.date")} value={fmtDate(transaction.date)} />
          <Field label={t("reconcile.field.currency")} value={transaction.currency} />
        </Panel>

        <div className="hidden sm:flex items-center justify-center shrink-0">
          <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center">
            <ArrowDown size={15} className="text-primary" />
          </div>

          {invoice ? (
            <Panel
              icon={<FileText size={16} className="text-white" />}
              title={invoice.vendorName ?? t("reconcile.unknownVendor")}
              subtitle={invoice.senderEmail}
              accentClass="bg-success"
            >
              <Field
                label={t("reconcile.field.invoiceNumber")}
                value={invoice.invoiceNumber ?? "—"}
                muted={!invoice.invoiceNumber}
              />
              <Field label={t("reconcile.field.amount")} value={fmtMoney(invoice.amount, invoice.currency)} />
              <Field label={t("reconcile.field.invoiceDate")} value={fmtDate(invoice.date)} />
              <Field
                label={t("reconcile.field.dueDate")}
                value={invoice.dueDate ? fmtDate(invoice.dueDate) : "—"}
                muted={!invoice.dueDate}
              />
            </Panel>
          ) : (
            <div className="flex-1 border border-dashed border-border rounded-[13px] flex flex-col items-center justify-center py-7 px-4 text-center">
              <FileText size={22} strokeWidth={1.5} className="text-faint mb-2" />
              <p className="text-sm font-semibold text-dim">{t("reconcile.drawer.noInvoiceLinked")}</p>
            </div>
          )}
        </div>

        {/* Gmail link */}
        {invoice && (
          <a
            href={invoice.gmailLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.75 text-sm font-semibold text-primary hover:underline w-fit"
          >
            <ExternalLink size={13} />
            {t("reconcile.drawer.viewSourceEmail")}
          </a>
        )}
      </div>

      {/* Match checks */}
      {invoice && (
        <div className="flex flex-wrap gap-2">
          <CheckChip ok={amountMatch} label={amountMatch ? t("reconcile.check.amountsMatch") : t("reconcile.check.amountsDiffer")} />
          {transaction.currency !== invoice.currency && (
            <CheckChip ok={false} label={t("reconcile.check.currenciesDiffer")} />
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
          {t("reconcile.drawer.viewSourceEmail")}
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
  const t = useT()
  return (
    <>
      {transaction.status === "MATCHED" && !transaction.matchConfirmed && (
        <>
          <ActionButton size="lg" variant="outline" disabled={pending} onClick={() => onRun(transaction.id, "reject")}>
            ✕ {t("reconcile.action.rejectMatch")}
          </ActionButton>
          <ActionButton size="lg" variant="green" disabled={pending} onClick={() => onRun(transaction.id, "confirm")}>
            ✓ {t("reconcile.action.confirmMatch")}
          </ActionButton>
        </>
      )}
      {transaction.status === "MATCHED" && transaction.matchConfirmed && (
        <ActionButton size="lg" variant="outline" disabled={pending} onClick={() => onRun(transaction.id, "undo")}>
          {t("reconcile.action.undoConfirmation")}
        </ActionButton>
      )}
      {transaction.status === "POSSIBLE" && (
        <>
          <ActionButton size="lg" variant="neutral" disabled={pending} onClick={() => onFind(transaction)}>
            {t("reconcile.action.changeInvoice")}
          </ActionButton>
          <ActionButton size="lg" variant="blue" disabled={pending} onClick={() => onRun(transaction.id, "confirm")}>
            {t("reconcile.action.confirmMatch")}
          </ActionButton>
        </>
      )}
      {transaction.status === "UNMATCHED" && (
        <>
          <ActionButton size="lg" variant="outline" disabled={pending} onClick={() => onRun(transaction.id, "no_invoice")}>
            {t("reconcile.action.noInvoiceNeeded")}
          </ActionButton>
          <ActionButton size="lg" variant="blue" disabled={pending} onClick={() => onFind(transaction)}>
            {t("reconcile.action.findInvoice")}
          </ActionButton>
        </>
      )}
      {transaction.status === "NO_INVOICE" && (
        <ActionButton size="lg" variant="outline" disabled={pending} onClick={() => onRun(transaction.id, "undo")}>
          {t("reconcile.action.undo")}
        </ActionButton>
      )}
    </>
  )
}

export const MatchDrawerBody = { Header, Content, Footer }
