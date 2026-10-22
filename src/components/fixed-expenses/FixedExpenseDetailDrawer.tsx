// Client component by import — only ever rendered from <FixedExpensesClient>.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { addDays, addMonths, format } from "date-fns"
import type { Locale as DateFnsLocale } from "date-fns"
import { Pause, Play, Pencil, Trash2, Link2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { CategoryBadge } from "@/components/invoices/CategoryBadge"
import { fmtAmount } from "@/components/invoices/helpers"
import { type FixedExpenseFrequency } from "@/lib/fixed-expense-meta"
import { useT, useDateFnsLocale } from "@/components/i18n/LocaleProvider"
import type { TranslationKey, TranslateParams } from "@/lib/i18n/translate"
import { useUpdateFixedExpense } from "@/hooks/useUpdateFixedExpense"
import { useDeleteFixedExpense } from "@/hooks/useDeleteFixedExpense"
import {
  useFixedExpenseTimeline,
  useFixedExpenseCandidates,
  useLinkInvoiceToFixedExpense,
} from "@/hooks/useFixedExpenseTimeline"
import { InvoiceDetailDrawer } from "@/components/invoices/InvoiceDetailsDrawer/InvoiceDetailDrawer"
import { useInvoice } from "@/hooks/useInvoice"
import { queries } from "@/queries"
import { FixedExpenseStatusBadge } from "./FixedExpenseStatusBadge"
import type { FixedExpenseRow, FixedExpenseTimelineEntry } from "./types"

function periodLabel(
  startIso: string,
  frequency: FixedExpenseFrequency,
  t: (key: TranslationKey, params?: TranslateParams) => string,
  locale?: DateFnsLocale,
): string {
  const d = new Date(startIso)
  if (frequency === "WEEKLY")
    return t("fixed_expenses.period.week_of", { date: format(d, "MMM d, yyyy", { locale }) })
  // Bi-weekly / bi-monthly span two units, so show the range they cover.
  if (frequency === "BIWEEKLY") return `${format(d, "MMM d", { locale })} – ${format(addDays(d, 13), "MMM d, yyyy", { locale })}`
  if (frequency === "BIMONTHLY") return `${format(d, "MMM", { locale })} – ${format(addMonths(d, 1), "MMM yyyy", { locale })}`
  if (frequency === "YEARLY") return format(d, "yyyy")
  if (frequency === "QUARTERLY") return `Q${Math.floor(d.getMonth() / 3) + 1} ${format(d, "yyyy")}`
  return format(d, "MMMM yyyy", { locale })
}

const sectionLabel = "text-xs font-bold text-text-secondary mb-2"

export function FixedExpenseDetailDrawer({
  expense,
  onEdit,
  onDismiss,
}: {
  expense: FixedExpenseRow
  onEdit: () => void
  onDismiss: () => void
}) {
  const t = useT()
  const dfl = useDateFnsLocale()
  const freqLabel = (f: FixedExpenseFrequency): string =>
    ({
      WEEKLY: t("fixed_expenses.frequency.weekly"),
      BIWEEKLY: t("fixed_expenses.frequency.biweekly"),
      MONTHLY: t("fixed_expenses.frequency.monthly"),
      BIMONTHLY: t("fixed_expenses.frequency.bimonthly"),
      QUARTERLY: t("fixed_expenses.frequency.quarterly"),
      YEARLY: t("fixed_expenses.frequency.yearly"),
    })[f]
  const router = useRouter()
  const queryClient = useQueryClient()
  const update = useUpdateFixedExpense()
  const remove = useDeleteFixedExpense()
  const timeline = useFixedExpenseTimeline(expense.id)
  const link = useLinkInvoiceToFixedExpense(expense.id)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Which period index is picking an invoice to link (null = picker closed).
  const [linkingIndex, setLinkingIndex] = useState<number | null>(null)
  const candidates = useFixedExpenseCandidates(expense.id, linkingIndex !== null)
  // Invoice drawer opened from a period (null = closed).
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null)
  // Period whose multiple invoices are being chosen from (null = chooser closed).
  const [chooser, setChooser] = useState<FixedExpenseTimelineEntry | null>(null)

  const paused = expense.status === "PAUSED"
  // Arrays now — join all vendor titles / senders for display.
  const vendorLabel = expense.vendorName.join(", ")
  const senderLabel = expense.senderEmail.join(", ")
  const source = vendorLabel || senderLabel || "—"

  function togglePause() {
    update.mutate(
      { id: expense.id, data: { status: paused ? "ACTIVE" : "PAUSED" } },
      { onSuccess: () => router.refresh() },
    )
  }

  function handleDelete() {
    remove.mutate(expense.id, {
      onSuccess: () => {
        setConfirmDelete(false)
        onDismiss()
        router.refresh()
      },
    })
  }

  function linkInvoice(invoiceId: string) {
    link.mutate(invoiceId, {
      onSuccess: () => {
        setLinkingIndex(null)
        router.refresh()
      },
    })
  }

  // Clicking a period jumps to its invoice: straight to the one if there's a
  // single match, otherwise a chooser so the user picks which invoice to open.
  function openPeriod(entry: FixedExpenseTimelineEntry) {
    if (entry.invoices.length === 1) setOpenInvoiceId(entry.invoices[0].id)
    else if (entry.invoices.length > 1) setChooser(entry)
  }

  const entries = timeline.data?.pages.flatMap((p) => p.entries) ?? []

  return (
    <SheetContent
      side="right"
      className="w-110 sm:max-w-110 gap-0 bg-surface border-s border-border"
      style={{ boxShadow: "-12px 0 40px rgba(80,110,180,.12)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5.5 py-4.5 border-b border-hover shrink-0">
        <div className="min-w-0 pe-8">
          <SheetTitle className="text-base font-bold text-heading truncate">{expense.name}</SheetTitle>
          {paused && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs font-bold text-dim">t("fixed_expenses.paused")</span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5.5">
        {/* Details */}
        <p className={sectionLabel}>{t("fixed_expenses.detail.details")}</p>
        <div className="border border-border rounded-lg overflow-hidden mb-5.5">
          {[
            { label: t("fixed_expenses.detail.source"), value: source },
            ...(senderLabel && vendorLabel
              ? [{ label: t("fixed_expenses.detail.sender"), value: senderLabel }]
              : []),
            { label: "Category", value: <CategoryBadge category={expense.category} /> },
            { label: t("fixed_expenses.detail.frequency"), value: freqLabel(expense.frequency) },
            {
              label: t("fixed_expenses.detail.expected_amount"),
              value: expense.expectedAmount ? fmtAmount(expense.expectedAmount, expense.currency) : "—",
            },
            ...(expense.sourceAccount
              ? [{ label: t("fixed_expenses.detail.mailbox"), value: expense.sourceAccount.label ?? expense.sourceAccount.email }]
              : []),
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-3.5 py-2.5 text-sm"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--color-hover)" : undefined }}
            >
              <span className="text-text-secondary">{row.label}</span>
              <span className="font-semibold text-text-primary text-end truncate ms-3">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <p className={sectionLabel}>{t("fixed_expenses.detail.invoice_history")}</p>
        {timeline.isLoading ? (
          <p className="text-xs text-dim">{t("fixed_expenses.detail.loading")}</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-dim">{t("fixed_expenses.detail.no_periods")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => {
              const hasInvoice = entry.invoices.length > 0
              const first = entry.invoices[0]
              return (
                <div
                  key={entry.index}
                  role={hasInvoice ? "button" : undefined}
                  tabIndex={hasInvoice ? 0 : undefined}
                  onClick={hasInvoice ? () => openPeriod(entry) : undefined}
                  onKeyDown={
                    hasInvoice
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            openPeriod(entry)
                          }
                        }
                      : undefined
                  }
                  className={`flex items-center justify-between gap-3 border border-border rounded-lg px-3.5 py-2.5 ${
                    hasInvoice ? "cursor-pointer hover:bg-hover transition-colors" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {periodLabel(entry.periodStart, expense.frequency, t, dfl)}
                    </p>
                    {hasInvoice ? (
                      <p className="text-[12px] text-text-secondary mt-0.5">
                        {fmtAmount(first.totalAmount, first.currency)} ·{" "}
                        {format(new Date(first.emailDate), "MMM d", { locale: dfl })}
                        {entry.invoices.length > 1 && (
                          <span className="text-dim"> · {t("fixed_expenses.detail.more_count", { count: entry.invoices.length - 1 })}</span>
                        )}
                      </p>
                    ) : entry.status === "OVERDUE" ? (
                      <button
                        type="button"
                        onClick={() => setLinkingIndex(entry.index)}
                        className="flex items-center gap-1.25 text-xs font-semibold text-primary hover:underline mt-0.5"
                      >
                        <Link2 size={12} strokeWidth={2} />
                        {t("fixed_expenses.timeline.link_existing")}
                      </button>
                    ) : (
                      <p className="text-[12px] text-dim mt-0.5">{t("fixed_expenses.timeline.no_invoice_yet")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <FixedExpenseStatusBadge status={entry.status} variant="timeline" />
                    {hasInvoice && <ChevronRight size={15} strokeWidth={2} className="text-dim" />}
                  </div>
                </div>
              )
            })}
            {timeline.hasNextPage && (
              <Button
                variant="ghost"
                disabled={timeline.isFetchingNextPage}
                onClick={() => timeline.fetchNextPage()}
              >
                {timeline.isFetchingNextPage ? t("fixed_expenses.detail.loading") : t("fixed_expenses.timeline.load_older")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex flex-col gap-2.5 px-5.5 py-4 border-t border-hover shrink-0">
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onEdit}
          >
            <Pencil size={15} strokeWidth={1.8} />
            {t("fixed_expenses.detail.edit")}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={update.isPending}
            onClick={togglePause}
          >
            {paused ? <Play size={15} strokeWidth={1.8} /> : <Pause size={15} strokeWidth={1.8} />}
            {paused ? t("fixed_expenses.detail.resume") : t("fixed_expenses.detail.pause")}
          </Button>
        </div>
        <Button
          variant="ghostDanger"
          disabled={remove.isPending}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 size={14} strokeWidth={1.8} />
          {t("fixed_expenses.detail.delete")}
        </Button>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmationDialog
          open={confirmDelete}
          onOpenChange={(open) => { if (!open) setConfirmDelete(false) }}
          title={t("fixed_expenses.delete.title")}
          description={t("fixed_expenses.delete.description")}
          confirmLabel={t("fixed_expenses.delete.confirm")}
          pendingLabel={t("fixed_expenses.delete.pending")}
          destructive
          isPending={remove.isPending}
          onConfirm={handleDelete}
        />
      )}

      {/* Manual link picker */}
      <Dialog name="fixed_expense_link_invoice" open={linkingIndex !== null} onOpenChange={(open) => { if (!open) setLinkingIndex(null) }}>
        <DialogContent className="sm:max-w-110">
          <DialogHeader>
            <DialogTitle>{t("fixed_expenses.link_picker.title")}</DialogTitle>
            <DialogDescription>
              {t("fixed_expenses.link_picker.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
            {candidates.isLoading ? (
              <p className="text-xs text-dim">{t("fixed_expenses.detail.loading")}</p>
            ) : (candidates.data?.candidates.length ?? 0) === 0 ? (
              <p className="text-xs text-dim">{t("fixed_expenses.link_picker.empty")}</p>
            ) : (
              candidates.data!.candidates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={link.isPending}
                  onClick={() => linkInvoice(c.id)}
                  className="flex items-center justify-between gap-3 border border-border rounded-lg px-3.5 py-2.5 text-start hover:bg-hover disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{c.vendorName ?? "—"}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {format(new Date(c.emailDate), "MMM d, yyyy", { locale: dfl })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-heading shrink-0">
                    {fmtAmount(c.totalAmount, c.currency)}
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Which invoice to open, when a period holds more than one */}
      <Dialog name="fixed_expense_period_invoices" open={chooser !== null} onOpenChange={(open) => { if (!open) setChooser(null) }}>
        {chooser && (
          <DialogContent className="sm:max-w-110">
            <DialogHeader>
              <DialogTitle>{t("fixed_expenses.period_chooser.title")}</DialogTitle>
              <DialogDescription>
                {t("fixed_expenses.period_chooser.description", {
                  period: periodLabel(chooser.periodStart, expense.frequency, t, dfl),
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
              {chooser.invoices.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => { setOpenInvoiceId(inv.id); setChooser(null) }}
                  className="flex items-center justify-between gap-3 border border-border rounded-lg px-3.5 py-2.5 text-start hover:bg-hover"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{inv.vendorName ?? "—"}</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">
                      {format(new Date(inv.emailDate), "MMM d, yyyy", { locale: dfl })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-heading shrink-0">
                    {fmtAmount(inv.totalAmount, inv.currency)}
                  </span>
                </button>
              ))}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Invoice detail, stacked over this drawer when a period is opened */}
      <Sheet open={openInvoiceId !== null} onOpenChange={(open) => { if (!open) setOpenInvoiceId(null) }}>
        {openInvoiceId && (
          <InvoiceDrawerLoader
            key={openInvoiceId}
            invoiceId={openInvoiceId}
            onDismiss={() => setOpenInvoiceId(null)}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: queries.invoices.detail(openInvoiceId).queryKey })
              queryClient.invalidateQueries({ queryKey: queries.fixedExpenses.timeline(expense.id).queryKey })
            }}
          />
        )}
      </Sheet>
    </SheetContent>
  )
}

// Fetches the full invoice for the stacked drawer. Kept separate so the query
// only runs while a period's invoice is open.
function InvoiceDrawerLoader({
  invoiceId,
  onDismiss,
  onSaved,
}: {
  invoiceId: string
  onDismiss: () => void
  onSaved: () => void
}) {
  const t = useT()
  const { data, isLoading } = useInvoice(invoiceId)

  if (isLoading || !data) {
    return (
      <SheetContent
        side="right"
        forceOverlay
        className="w-110 sm:max-w-110 gap-0 bg-white border-s border-[#E8EDFA]"
      >
        <SheetTitle className="sr-only">{t("fixed_expenses.invoice_loader.sr_title")}</SheetTitle>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-dim">{t("fixed_expenses.invoice_loader.loading")}</p>
        </div>
      </SheetContent>
    )
  }

  return <InvoiceDetailDrawer invoice={data} onSaved={onSaved} onDismiss={onDismiss} />
}
