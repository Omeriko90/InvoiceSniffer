// Client component by import — only ever rendered from <InvoicesClient>.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Clock, ExternalLink, EyeOff, FileText, FileX, Lock, Repeat, X } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useUpdateInvoice } from "@/hooks/useUpdateInvoice"
import { useRemoveInvoice } from "@/hooks/useRemoveInvoice"
import { useUnlinkFixedExpense } from "@/hooks/useUnlinkFixedExpense"
import type { RemovalReason } from "@/api/invoices"
import { STATUS_META } from "./constants"
import { fmtAmount, fmtSize, toDraft } from "./helpers"
import type { InvoiceRow } from "./types"
import { VendorCell } from "./VendorCell"
import { StatusBadge } from "./StatusBadge"
import { CategoryBadge } from "./CategoryBadge"
import { CATEGORY_LABELS, CATEGORY_SELECTABLE, type InvoiceCategory } from "@/lib/invoice-categories"
import { FixedExpenseFormDialog } from "@/components/fixed-expenses/FixedExpenseFormDialog"
import { track } from "@/lib/analytics"

export function InvoiceDetailDrawer({ invoice, onSaved, onDismiss }: {
  invoice: InvoiceRow
  onSaved: (updated: InvoiceRow) => void
  onDismiss: () => void
}) {
  const router = useRouter()
  const update = useUpdateInvoice()
  const remove = useRemoveInvoice(() => router.refresh())
  const unlink = useUnlinkFixedExpense(() => router.refresh())
  const [unlinkOpen, setUnlinkOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => toDraft(invoice))
  const [categoryDraft, setCategoryDraft] = useState<InvoiceCategory>(invoice.category)
  // Which removal is awaiting confirmation (null = dialog closed), and whether
  // the user opted to also mute the sender (only offered for "not relevant").
  const [confirmReason, setConfirmReason] = useState<RemovalReason | null>(null)
  const [muteSender, setMuteSender] = useState(false)
  const [markFixedOpen, setMarkFixedOpen] = useState(false)

  function openConfirm(reason: RemovalReason) {
    setMuteSender(false)
    setConfirmReason(reason)
  }

  function handleRemove() {
    if (!confirmReason) return
    remove.mutate(
      {
        id: invoice.id,
        reason: confirmReason,
        muteSender: confirmReason === "NOT_RELEVANT" ? muteSender : undefined,
      },
      {
        onSuccess: () => {
          setConfirmReason(null)
          onDismiss()
          router.refresh()
        },
      }
    )
  }

  const vendor = invoice.vendorName ?? invoice.senderName ?? invoice.senderEmail
  const status = STATUS_META[invoice.status] ?? STATUS_META.DETECTED

  const amountValid =
    draft.totalAmount.trim() !== "" &&
    Number.isFinite(Number(draft.totalAmount)) &&
    Number(draft.totalAmount) >= 0

  function setField(field: keyof ReturnType<typeof toDraft>, value: string) {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  function handleSave() {
    const data = {
      vendorName: draft.vendorName.trim() || null,
      invoiceNumber: draft.invoiceNumber.trim() || null,
      totalAmount: draft.totalAmount.trim(),
      invoiceDate: draft.invoiceDate || null,
      dueDate: draft.dueDate || null,
      category: categoryDraft,
    }
    update.mutate(
      { id: invoice.id, data },
      {
        onSuccess: () => {
          setEditing(false)
          onSaved({
            ...invoice,
            vendorName: data.vendorName,
            invoiceNumber: data.invoiceNumber,
            totalAmount: data.totalAmount,
            invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toISOString() : null,
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
            category: data.category,
          })
          router.refresh()
        },
      }
    )
  }

  return (
    <SheetContent
      side="right"
      className="w-[440px] sm:max-w-[440px] gap-0 bg-white border-l border-[#E8EDFA]"
      style={{ boxShadow: "-12px 0 40px rgba(80,110,180,.12)" }}
    >
      {/* Drawer header */}
      <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-[#F1F3F8] shrink-0">
        <div className="flex items-center gap-[11px] min-w-0 pr-8">
          <VendorCell vendor={vendor} />
          <div className="min-w-0">
            <SheetTitle className="text-[15px] font-[700] text-heading truncate">{vendor}</SheetTitle>
            {invoice.invoiceNumber && (
              <p className="text-[12px] text-[#94A3B8] font-mono">{invoice.invoiceNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-[22px]">
        {/* Amount */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[30px] font-[800] text-heading tracking-[-0.02em] leading-none">
            {fmtAmount(invoice.totalAmount, invoice.currency)}
          </span>
          <StatusBadge status={status} />
          <CategoryBadge category={invoice.category} />
        </div>

        {/* Fixed-expense link indication */}
        {invoice.fixedExpense && (
          <div className="flex items-center gap-[7px] -mt-4 mb-6 px-[11px] py-[8px] rounded-[10px] bg-info-bg">
            <Repeat size={14} strokeWidth={1.8} className="text-primary shrink-0" />
            <span className="text-[12.5px] font-[600] text-text-primary truncate">
              Fixed expense · {invoice.fixedExpense.name}
            </span>
            <button
              type="button"
              onClick={() => setUnlinkOpen(true)}
              disabled={unlink.isPending}
              className="ml-auto shrink-0 text-[#94A3B8] hover:text-[#DC2626] disabled:opacity-50"
              aria-label="Remove from fixed expense"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Extracted fields */}
        <p className="text-[11px] font-[700] text-[#64748B] uppercase tracking-[0.05em] mb-2">
          Extracted fields
        </p>
        {editing ? (
        <div className="flex flex-col gap-[13px] border border-[#E8EDFA] rounded-[11px] p-[13px] mb-[22px]">
          {[
            { field: "vendorName" as const,    label: "Vendor",       type: "text" },
            { field: "invoiceNumber" as const, label: "Invoice #",    type: "text" },
            { field: "totalAmount" as const,   label: `Amount (${invoice.currency})`, type: "number" },
            { field: "invoiceDate" as const,   label: "Invoice date", type: "date" },
            { field: "dueDate" as const,       label: "Due date",     type: "date" },
          ].map((f) => (
            <div key={f.field} className="flex flex-col gap-[5px]">
              <Label
                htmlFor={`edit-${f.field}`}
                className="text-[12px] font-[600] text-[#64748B]"
              >
                {f.label}
              </Label>
              <Input
                id={`edit-${f.field}`}
                type={f.type}
                step={f.type === "number" ? "0.01" : undefined}
                min={f.type === "number" ? "0" : undefined}
                value={draft[f.field]}
                onChange={(e) => setField(f.field, e.target.value)}
                className="h-auto px-[11px] py-[7px] text-[13px] text-text-primary border-[#E8EDFA] rounded-[9px]"
              />
            </div>
          ))}
          {/* Category */}
          <div className="flex flex-col gap-[5px]">
            <Label className="text-[12px] font-[600] text-[#64748B]">Category</Label>
            <Select
              items={CATEGORY_SELECTABLE.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
              value={categoryDraft}
              onValueChange={(v) => setCategoryDraft(v as InvoiceCategory)}
            >
              <SelectTrigger className="h-auto px-[11px] py-[7px] text-[13px] text-text-primary border-[#E8EDFA] rounded-[9px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" className="w-fit">
                {CATEGORY_SELECTABLE.map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        ) : (
        <div className="border border-[#E8EDFA] rounded-[11px] overflow-hidden mb-[22px]">
          {[
            { label: "Invoice #", value: invoice.invoiceNumber ?? "—", mono: true },
            { label: "Amount",    value: fmtAmount(invoice.totalAmount, invoice.currency) },
            { label: "Tax",       value: invoice.taxAmount != null ? fmtAmount(invoice.taxAmount, invoice.currency) : "—" },
            { label: "Invoice date", value: invoice.invoiceDate ? format(new Date(invoice.invoiceDate), "MMM d, yyyy") : "—" },
            // Most receipts are already paid, so a missing due date means
            // "not applicable" — hide the row rather than show a dash
            ...(invoice.dueDate
              ? [{ label: "Due date", value: format(new Date(invoice.dueDate), "MMM d, yyyy") }]
              : []),
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-[13px] py-[10px] text-[13px]"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid #F1F3F8" : undefined }}
            >
              <span className="text-[#64748B]">{row.label}</span>
              <span
                className="font-[600] text-[#334155]"
                style={row.mono ? { fontFamily: "var(--font-mono)" } : undefined}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
        )}

        {/* Source email */}
        <p className="text-[11px] font-[700] text-[#64748B] uppercase tracking-[0.05em] mb-2">
          Source email
        </p>
        <div className="border border-[#E8EDFA] rounded-[11px] p-[13px] mb-[22px]">
          <p className="text-[13px] font-[600] text-[#334155] leading-snug">{invoice.subject}</p>
          <p className="text-[12.5px] text-[#64748B] mt-1">{invoice.senderEmail}</p>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">
            {format(new Date(invoice.emailDate), "MMM d, yyyy")}
          </p>
          <p className="text-[12px] text-[#94A3B8] mt-[6px] pt-[8px] border-t border-[#F1F5F9]">
            Received in{" "}
            <span className="font-[600] text-[#64748B]">
              {invoice.sourceAccount?.label ?? invoice.sourceAccount?.email ?? "Unknown mailbox"}
            </span>
          </p>
        </div>

        {/* Attachments — served on demand from Gmail, never stored */}
        {invoice.attachmentMeta.length > 0 && (
          <p className="text-[11px] font-[700] text-[#64748B] uppercase tracking-[0.05em] mb-2">
            Attached documents
          </p>
        )}
        {invoice.attachmentMeta.length > 0 && invoice.attachmentMeta.map((att, i) => (
          <a
            key={i}
            href={`/api/invoices/${invoice.id}/attachments/${i}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[10px] bg-[#F8FAFF] border border-[#E8EDFA] rounded-[11px] p-[11px_13px] mb-[14px] hover:bg-[#EFF6FF] transition-colors"
          >
            <div className="w-[34px] h-[34px] rounded-lg bg-[#FEF2F2] flex items-center justify-center shrink-0">
              <FileText size={16} strokeWidth={1.5} className="text-[#FB7171]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[600] text-[#334155] truncate">{att.filename}</p>
              <p className="text-[11.5px] text-[#94A3B8]">{fmtSize(att.size)}</p>
            </div>
            <ExternalLink size={14} strokeWidth={1.5} className="text-[#94A3B8] shrink-0" />
          </a>
        ))}

        {/* Hosted receipt link */}
        {invoice.receiptUrl && (
          <p className="text-[11px] font-[700] text-[#64748B] uppercase tracking-[0.05em] mb-2">
            Receipt link
          </p>
        )}
        {invoice.receiptUrl && (
          <a
            href={invoice.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[10px] bg-[#F8FAFF] border border-[#E8EDFA] rounded-[11px] p-[11px_13px] mb-[14px] hover:bg-[#EFF6FF] transition-colors"
          >
            <div className="w-[34px] h-[34px] rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
              <ExternalLink size={16} strokeWidth={1.5} className="text-[#3B6FE0]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[600] text-[#334155]">View hosted receipt</p>
              <p className="text-[11.5px] text-[#94A3B8] truncate">{new URL(invoice.receiptUrl).hostname}</p>
            </div>
          </a>
        )}

        {/* Privacy note */}
        <div className="flex items-center gap-[7px] text-[11.5px] text-[#94A3B8]">
          <Lock size={13} strokeWidth={1.5} className="shrink-0" />
          <span>The file itself is never stored — it&apos;s fetched from Gmail only during an export.</span>
        </div>

        {/* Actions */}
        {!editing && (
          <div className="mt-[22px]">
            <p className="text-[11px] font-[700] text-[#64748B] uppercase tracking-[0.05em] mb-2">
              Actions
            </p>

            {!invoice.fixedExpense && (
              <button
                type="button"
                onClick={() => setMarkFixedOpen(true)}
                className="w-full flex items-center gap-[11px] bg-info-bg border border-transparent rounded-[11px] p-[11px_13px] mb-[10px] hover:brightness-[0.98] transition"
              >
                <div className="w-[34px] h-[34px] rounded-lg bg-white/70 flex items-center justify-center shrink-0">
                  <Clock size={16} strokeWidth={1.8} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-[600] text-heading">Mark as fixed expense</p>
                  <p className="text-[11.5px] text-[#94A3B8]">Track this vendor on a recurring schedule</p>
                </div>
                <ChevronRight size={16} strokeWidth={1.8} className="text-[#94A3B8] shrink-0" />
              </button>
            )}

            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => openConfirm("NOT_RELEVANT")}
              className="w-full flex items-center gap-[11px] rounded-[11px] border border-[#FBDCDC] bg-[#FEF6F6] p-[11px_13px] mb-[10px] hover:bg-[#FDECEC] transition disabled:opacity-50"
            >
              <div className="w-[34px] h-[34px] rounded-lg bg-[#FDE4E4] flex items-center justify-center shrink-0">
                <EyeOff size={16} strokeWidth={1.8} className="text-[#DC2626]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-[600] text-[#DC2626]">Mark as not relevant</p>
                <p className="text-[11.5px] text-[#D08A8A]">Hide from reconciliation and exports</p>
              </div>
            </button>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => openConfirm("NOT_AN_INVOICE")}
              className="w-full flex items-center gap-[11px] rounded-[11px] border border-[#FBDCDC] bg-[#FEF6F6] p-[11px_13px] hover:bg-[#FDECEC] transition disabled:opacity-50"
            >
              <div className="w-[34px] h-[34px] rounded-lg bg-[#FDE4E4] flex items-center justify-center shrink-0">
                <FileX size={16} strokeWidth={1.8} className="text-[#DC2626]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-[600] text-[#DC2626]">Mark as not an invoice</p>
                <p className="text-[11.5px] text-[#D08A8A]">Reclassify this email as something else</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-[10px] px-[22px] py-[16px] border-t border-[#F1F3F8] shrink-0">
        <div className="flex gap-[10px]">
        {editing ? (
          <>
            <Button
              variant="outline"
              className="flex-1 h-auto py-[10px] rounded-[10px] border-[#E8EDFA] text-[13.5px] font-[600] text-heading"
              disabled={update.isPending}
              onClick={() => {
                setDraft(toDraft(invoice))
                setCategoryDraft(invoice.category)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-auto py-[10px] rounded-[10px] text-white text-[13.5px] font-[700] border-0"
              style={{ background: "linear-gradient(135deg,#7AA7FF,#A78BFA)" }}
              disabled={update.isPending || !amountValid}
              onClick={handleSave}
            >
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="flex-1 h-auto py-[10px] rounded-[10px] border-[#E8EDFA] text-[13.5px] font-[600] text-heading"
              nativeButton={false}
              render={<a href={invoice.gmailLink} target="_blank" rel="noopener noreferrer" />}
            >
              <ExternalLink size={15} strokeWidth={1.5} />
              Open in Gmail
            </Button>
            <Button
              className="flex-1 h-auto py-[10px] rounded-[10px] text-white text-[13.5px] font-[700] border-0"
              style={{ background: "linear-gradient(135deg,#7AA7FF,#A78BFA)" }}
              onClick={() => setEditing(true)}
            >
              Edit fields
            </Button>
          </>
        )}
        </div>
      </div>

      {/* Removal confirmation */}
      <Dialog
        name="invoice_remove_confirm"
        open={confirmReason !== null}
        onOpenChange={(open) => { if (!open) setConfirmReason(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmReason === "NOT_AN_INVOICE" ? "Mark as not an invoice?" : "Remove this invoice?"}
            </DialogTitle>
            <DialogDescription>
              {confirmReason === "NOT_AN_INVOICE"
                ? "It's removed from your list and similar emails from this sender are detected less often. You can undo this."
                : "It genuinely is an invoice but won't appear in your list. You can undo this."}
            </DialogDescription>
          </DialogHeader>

          {confirmReason === "NOT_RELEVANT" && (
            <Label
              htmlFor="mute-sender"
              className="flex items-center gap-[9px] text-[13px] font-[500] text-[#334155] cursor-pointer"
            >
              <Checkbox
                id="mute-sender"
                checked={muteSender}
                onCheckedChange={(checked) => setMuteSender(checked === true)}
              />
              Also stop showing invoices from this sender
            </Label>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-[10px] text-[13.5px] font-[600]"
              disabled={remove.isPending}
              onClick={() => setConfirmReason(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-[10px] text-white text-[13.5px] font-[700] border-0 bg-[#DC2626] hover:bg-[#B91C1C]"
              disabled={remove.isPending}
              onClick={handleRemove}
            >
              {remove.isPending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as fixed expense — pre-filled from this invoice, links it on save */}
      <Dialog name="invoice_mark_fixed" open={markFixedOpen} onOpenChange={(open) => { if (!open) setMarkFixedOpen(false) }}>
        {markFixedOpen && (
          <FixedExpenseFormDialog
            prefill={{
              name: invoice.vendorName ?? invoice.senderName ?? "",
              category: invoice.category,
              vendorName: invoice.vendorName ?? "",
              senderEmail: invoice.senderEmail,
              expectedAmount: invoice.totalAmount,
              currency: invoice.currency,
            }}
            linkInvoiceId={invoice.id}
            mailboxes={[]}
            onClose={() => setMarkFixedOpen(false)}
            onSaved={() => {
              track("invoice_marked_fixed", { invoiceId: invoice.id })
              router.refresh()
            }}
          />
        )}
      </Dialog>

      {/* Remove this invoice from its fixed expense */}
      <Dialog name="invoice_unlink" open={unlinkOpen} onOpenChange={(open) => { if (!open) setUnlinkOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from fixed expense?</DialogTitle>
            <DialogDescription>
              This invoice will no longer count toward
              {invoice.fixedExpense ? ` “${invoice.fixedExpense.name}”` : " this fixed expense"}.
              The fixed expense keeps its match rules, so a matching invoice can re-link later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-[10px] text-[13.5px] font-[600]"
              disabled={unlink.isPending}
              onClick={() => setUnlinkOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-[10px] text-white text-[13.5px] font-[700] border-0 bg-[#DC2626] hover:bg-[#B91C1C]"
              disabled={unlink.isPending}
              onClick={() => unlink.mutate(invoice.id, { onSuccess: () => {
                track("invoice_unlinked", { invoiceId: invoice.id })
                setUnlinkOpen(false)
              } })}
            >
              {unlink.isPending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SheetContent>
  )
}
