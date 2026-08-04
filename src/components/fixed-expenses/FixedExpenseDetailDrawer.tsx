// Client component by import — only ever rendered from <FixedExpensesClient>.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Pause, Play, Pencil, Trash2, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SheetContent, SheetTitle } from "@/components/ui/sheet"
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
import { FREQUENCY_LABELS, type FixedExpenseFrequency } from "@/lib/fixed-expense-meta"
import { useUpdateFixedExpense } from "@/hooks/useUpdateFixedExpense"
import { useDeleteFixedExpense } from "@/hooks/useDeleteFixedExpense"
import {
  useFixedExpenseTimeline,
  useFixedExpenseCandidates,
  useLinkInvoiceToFixedExpense,
} from "@/hooks/useFixedExpenseTimeline"
import { FixedExpenseStatusBadge } from "./FixedExpenseStatusBadge"
import type { FixedExpenseRow } from "./types"

function periodLabel(startIso: string, frequency: FixedExpenseFrequency): string {
  const d = new Date(startIso)
  if (frequency === "WEEKLY") return `Week of ${format(d, "MMM d, yyyy")}`
  if (frequency === "YEARLY") return format(d, "yyyy")
  if (frequency === "QUARTERLY") return `Q${Math.floor(d.getMonth() / 3) + 1} ${format(d, "yyyy")}`
  return format(d, "MMMM yyyy")
}

const sectionLabel = "text-[11px] font-[700] text-text-secondary uppercase tracking-[0.05em] mb-2"

export function FixedExpenseDetailDrawer({
  expense,
  onEdit,
  onDismiss,
}: {
  expense: FixedExpenseRow
  onEdit: () => void
  onDismiss: () => void
}) {
  const router = useRouter()
  const update = useUpdateFixedExpense()
  const remove = useDeleteFixedExpense()
  const timeline = useFixedExpenseTimeline(expense.id)
  const link = useLinkInvoiceToFixedExpense(expense.id)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Which period index is picking an invoice to link (null = picker closed).
  const [linkingIndex, setLinkingIndex] = useState<number | null>(null)
  const candidates = useFixedExpenseCandidates(expense.id, linkingIndex !== null)

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

  const entries = timeline.data?.pages.flatMap((p) => p.entries) ?? []

  return (
    <SheetContent
      side="right"
      className="w-[440px] sm:max-w-[440px] gap-0 bg-surface border-l border-border"
      style={{ boxShadow: "-12px 0 40px rgba(80,110,180,.12)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-hover shrink-0">
        <div className="min-w-0 pr-8">
          <SheetTitle className="text-[15px] font-[700] text-heading truncate">{expense.name}</SheetTitle>
          <div className="flex items-center gap-[8px] mt-[6px]">
            <FixedExpenseStatusBadge status={expense.currentStatus} />
            <CategoryBadge category={expense.category} />
            {paused && (
              <span className="text-[11px] font-[700] text-dim uppercase tracking-[0.04em]">Paused</span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-[22px]">
        {/* Details */}
        <p className={sectionLabel}>Details</p>
        <div className="border border-border rounded-[11px] overflow-hidden mb-[22px]">
          {[
            { label: "Source", value: source },
            ...(senderLabel && vendorLabel
              ? [{ label: "Sender", value: senderLabel }]
              : []),
            { label: "Frequency", value: FREQUENCY_LABELS[expense.frequency] },
            {
              label: "Expected amount",
              value: expense.expectedAmount ? fmtAmount(expense.expectedAmount, expense.currency) : "—",
            },
            ...(expense.sourceAccount
              ? [{ label: "Mailbox", value: expense.sourceAccount.label ?? expense.sourceAccount.email }]
              : []),
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-[13px] py-[10px] text-[13px]"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--color-hover)" : undefined }}
            >
              <span className="text-text-secondary">{row.label}</span>
              <span className="font-[600] text-text-primary text-right truncate ml-3">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <p className={sectionLabel}>Invoice history</p>
        {timeline.isLoading ? (
          <p className="text-[12.5px] text-dim">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-[12.5px] text-dim">No periods yet.</p>
        ) : (
          <div className="flex flex-col gap-[8px]">
            {entries.map((entry) => (
              <div
                key={entry.index}
                className="flex items-center justify-between gap-3 border border-border rounded-[11px] px-[13px] py-[10px]"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-[600] text-text-primary">
                    {periodLabel(entry.periodStart, expense.frequency)}
                  </p>
                  {entry.invoice ? (
                    <p className="text-[12px] text-text-secondary mt-0.5">
                      {fmtAmount(entry.invoice.totalAmount, entry.invoice.currency)} ·{" "}
                      {format(new Date(entry.invoice.emailDate), "MMM d")}
                    </p>
                  ) : entry.status === "OVERDUE" ? (
                    <button
                      type="button"
                      onClick={() => setLinkingIndex(entry.index)}
                      className="flex items-center gap-[5px] text-[12px] font-[600] text-primary hover:underline mt-0.5"
                    >
                      <Link2 size={12} strokeWidth={2} />
                      Link an existing invoice
                    </button>
                  ) : null}
                </div>
                <FixedExpenseStatusBadge status={entry.status} variant="timeline" />
              </div>
            ))}
            {timeline.hasNextPage && (
              <Button
                variant="ghost"
                className="h-auto py-[8px] rounded-[10px] text-[13px] font-[600] text-text-secondary"
                disabled={timeline.isFetchingNextPage}
                onClick={() => timeline.fetchNextPage()}
              >
                {timeline.isFetchingNextPage ? "Loading…" : "Load older periods"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex flex-col gap-[10px] px-[22px] py-[16px] border-t border-hover shrink-0">
        <div className="flex gap-[10px]">
          <Button
            variant="outline"
            className="flex-1 h-auto py-[10px] rounded-[10px] border-border text-[13.5px] font-[600] text-heading"
            onClick={onEdit}
          >
            <Pencil size={15} strokeWidth={1.8} />
            Edit
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-auto py-[10px] rounded-[10px] border-border text-[13.5px] font-[600] text-heading"
            disabled={update.isPending}
            onClick={togglePause}
          >
            {paused ? <Play size={15} strokeWidth={1.8} /> : <Pause size={15} strokeWidth={1.8} />}
            {paused ? "Resume" : "Pause"}
          </Button>
        </div>
        <Button
          variant="ghost"
          className="h-auto py-[8px] rounded-[10px] text-[13px] font-[600] text-dim hover:text-danger hover:bg-danger-bg"
          disabled={remove.isPending}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 size={14} strokeWidth={1.8} />
          Delete fixed expense
        </Button>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmationDialog
          open={confirmDelete}
          onOpenChange={(open) => { if (!open) setConfirmDelete(false) }}
          title="Delete this fixed expense?"
          description="Its arrival history is removed. The linked invoices themselves are kept — only the tracking is deleted."
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          destructive
          isPending={remove.isPending}
          onConfirm={handleDelete}
        />
      )}

      {/* Manual link picker */}
      <Dialog open={linkingIndex !== null} onOpenChange={(open) => { if (!open) setLinkingIndex(null) }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Link an existing invoice</DialogTitle>
            <DialogDescription>
              Pick an invoice that belongs to this expense. It attaches to whichever period it falls in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-[8px] max-h-[50vh] overflow-y-auto">
            {candidates.isLoading ? (
              <p className="text-[12.5px] text-dim">Loading…</p>
            ) : (candidates.data?.candidates.length ?? 0) === 0 ? (
              <p className="text-[12.5px] text-dim">No unlinked invoices match this vendor or sender.</p>
            ) : (
              candidates.data!.candidates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={link.isPending}
                  onClick={() => linkInvoice(c.id)}
                  className="flex items-center justify-between gap-3 border border-border rounded-[11px] px-[13px] py-[10px] text-left hover:bg-hover disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-[600] text-text-primary truncate">{c.vendorName ?? "—"}</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">
                      {format(new Date(c.emailDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <span className="text-[13px] font-[700] text-heading shrink-0">
                    {fmtAmount(c.totalAmount, c.currency)}
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SheetContent>
  )
}
