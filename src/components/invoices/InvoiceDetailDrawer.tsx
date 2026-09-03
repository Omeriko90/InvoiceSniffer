// Client component by import — only ever rendered from <InvoicesClient>.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, ChevronRight, Clock, ExternalLink, EyeOff, FileText, FileX, Lock, Repeat, Trash2, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
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
import { Dialog } from "@/components/ui/dialog"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useUpdateInvoice } from "@/hooks/useUpdateInvoice"
import { useRemoveInvoice } from "@/hooks/useRemoveInvoice"
import { useUnlinkFixedExpense } from "@/hooks/useUnlinkFixedExpense"
import type { RemovalReason } from "@/api/invoices"
import { fmtMoney, fmtDisplayMoney, hasDistinctOriginal } from "@/lib/money"
import { fmtAmount, fmtSize, toDraft } from "./helpers"
import type { InvoiceRow } from "./types"
import { VendorCell } from "./VendorCell"
import { CategoryBadge } from "./CategoryBadge"
import { DocumentTypeBadge } from "./DocumentTypeBadge"
import { CATEGORY_LABELS, CATEGORY_SELECTABLE, type InvoiceCategory } from "@/lib/invoice-categories"
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_SELECTABLE, type DocumentType } from "@/lib/document-types"
import { FixedExpenseFormDialog } from "@/components/fixed-expenses/FixedExpenseFormDialog"
import { track } from "@/lib/analytics"

export function InvoiceDetailDrawer({ invoice, onSaved, onDismiss }: {
  invoice: InvoiceRow
  onSaved: (updated: InvoiceRow) => void
  onDismiss: () => void
}) {
  const router = useRouter()
  const [unlinkOpen, setUnlinkOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => toDraft(invoice))
  const [categoryDraft, setCategoryDraft] = useState<InvoiceCategory>(invoice.category)
  const [documentTypeDraft, setDocumentTypeDraft] = useState<DocumentType>(invoice.documentType)
  // Which removal is awaiting confirmation (null = dialog closed), and whether
  // the user opted to also mute the sender (only offered for "not relevant").
  const [confirmReason, setConfirmReason] = useState<RemovalReason | null>(null)
  const [muteSender, setMuteSender] = useState(false)
  const [markFixedOpen, setMarkFixedOpen] = useState(false)
  const update = useUpdateInvoice()
  const remove = useRemoveInvoice(() => router.refresh())
  const {mutate: unlink, isPending: unlinkPending} = useUnlinkFixedExpense(() => {
    track("invoice_unlinked", { invoiceId: invoice.id })
      setUnlinkOpen(false)
    router.refresh()})

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

  const amountValid =
    draft.totalAmount.trim() !== "" &&
    Number.isFinite(Number(draft.totalAmount)) &&
    Number(draft.totalAmount) >= 0

  function setField(field: keyof ReturnType<typeof toDraft>, value: string) {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  function handleUnlink() {
    unlink(invoice.id)
  }

  function handleSave() {
    const data = {
      vendorName: draft.vendorName.trim() || null,
      invoiceNumber: draft.invoiceNumber.trim() || null,
      totalAmount: draft.totalAmount.trim(),
      invoiceDate: draft.invoiceDate || null,
      dueDate: draft.dueDate || null,
      category: categoryDraft,
      documentType: documentTypeDraft,
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
            documentType: data.documentType,
          })
          router.refresh()
        },
      }
    )
  }

  return (
    <SheetContent
      side="right"
      className="w-110 sm:max-w-110 gap-0 bg-white border-l border-border"
      style={{ boxShadow: "-12px 0 40px rgba(80,110,180,.12)" }}
    >
      {/* Drawer header */}
      <div className="flex items-center justify-between px-5.5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-8">
          <VendorCell vendor={vendor} />
          <div className="min-w-0">
            <SheetTitle className="text-lg font-bold text-heading truncate">{vendor}</SheetTitle>
            {invoice.invoiceNumber && (
              <p className="text-xs text-dim font-mono">{invoice.invoiceNumber}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5.5">
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-heading tracking-tight leading-none">
              {fmtDisplayMoney(invoice)}
            </span>
            <CategoryBadge category={invoice.category} />
            <DocumentTypeBadge documentType={invoice.documentType} />
          </div>
          {hasDistinctOriginal(invoice) && (
            <p className="mt-2 text-sm text-text-secondary">
              {fmtMoney(invoice.totalAmount, invoice.currency)} original
            </p>
          )}
        </div>

        {invoice.fixedExpense && (
          <div className="flex items-center gap-1.75 -mt-2 mb-6 px-2.75 py-2 rounded-lg bg-info-bg">
            <Repeat size={14} strokeWidth={1.8} className="text-primary shrink-0" />
            <span className="text-sm font-semibold text-text-primary truncate">
              Fixed expense · {invoice.fixedExpense.name}
            </span>
            <button
              type="button"
              onClick={() => setUnlinkOpen(true)}
              disabled={unlinkPending}
              className="ml-auto shrink-0 text-[#94A3B8] hover:text-[#DC2626] disabled:opacity-50"
              aria-label="Remove from fixed expense"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        )}

        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
          Extracted fields
        </p>
        {editing ? (
        <div className="flex flex-col gap-3.25 border border-[#E8EDFA] rounded-[11px] p-3.25 mb-5.5">
          {[
            { field: "vendorName" as const,    label: "Vendor",       type: "text" },
            { field: "invoiceNumber" as const, label: "Invoice #",    type: "text" },
            { field: "totalAmount" as const,   label: `Amount (${invoice.currency})`, type: "number" },
            { field: "invoiceDate" as const,   label: "Invoice date", type: "date" },
            { field: "dueDate" as const,       label: "Due date",     type: "date" },
          ].map((f) => (
            <div key={f.field} className="flex flex-col gap-1.25">
              <Label
                htmlFor={`edit-${f.field}`}
                className="text-[12px] font-semibold text-text-secondary"
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
                className="h-auto px-2.75 py-1.75 text-[13px] text-text-primary border-[#E8EDFA] rounded-[9px]"
              />
            </div>
          ))}
          {/* Document type */}
          <div className="flex flex-col gap-1.25">
            <Label className="text-[12px] font-semibold text-text-secondary">Type</Label>
            <Select
              items={DOCUMENT_TYPE_SELECTABLE.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABELS[t] }))}
              value={documentTypeDraft}
              onValueChange={(v) => setDocumentTypeDraft(v as DocumentType)}
            >
              <SelectTrigger className="h-auto px-2.75 py-1.75 text-[13px] text-text-primary border-[#E8EDFA] rounded-[9px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" className="w-fit">
                {DOCUMENT_TYPE_SELECTABLE.map((t) => (
                  <SelectItem key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Category */}
          <div className="flex flex-col gap-1.25">
            <Label className="text-[12px] font-semibold text-text-secondary">Category</Label>
            <Select
              items={CATEGORY_SELECTABLE.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
              value={categoryDraft}
              onValueChange={(v) => setCategoryDraft(v as InvoiceCategory)}
            >
              <SelectTrigger className="h-auto px-2.75 py-1.75 text-[13px] text-text-primary border-[#E8EDFA] rounded-[9px]">
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
        <div className="border border-[#E8EDFA] rounded-[11px] overflow-hidden mb-5.5">
          {[
            { label: "Invoice #", value: invoice.invoiceNumber ?? "—", mono: true },
            { label: "Amount",    value: fmtDisplayMoney(invoice) },
            ...(hasDistinctOriginal(invoice)
              ? [{ label: "Original amount", value: fmtMoney(invoice.totalAmount, invoice.currency) }]
              : []),
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
              className={cn(
                "flex items-center justify-between px-[13px] py-2.5 text-sm",
                i < arr.length - 1 && "border-b border-hover",
              )}
            >
              <span className="text-text-secondary">{row.label}</span>
              <span
                className="font-semibold text-text-primary"
                style={row.mono ? { fontFamily: "var(--font-mono)" } : undefined}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
        )}

        {/* Source email */}
        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
          Source email
        </p>
        <div className="border border-[#E8EDFA] rounded-[11px] p-3.25 mb-5.5">
          <p className="text-[13px] font-semibold text-text-primary leading-snug">{invoice.subject}</p>
          <p className="text-[12.5px] text-text-secondary mt-1">{invoice.senderEmail}</p>
          <p className="text-[12px] text-text-secondary mt-0.5">
            {format(new Date(invoice.emailDate), "MMM d, yyyy")}
          </p>
          <p className="text-[12px] text-text-secondary mt-1.5 pt-2 border-t border-[#F1F5F9]">
            Received in{" "}
            <span className="font-semibold text-primary">
              {invoice.sourceAccount?.label ?? invoice.sourceAccount?.email ?? "Unknown mailbox"}
            </span>
          </p>
        </div>

        {/* Attachments — served on demand from Gmail, never stored */}
        {invoice.attachmentMeta.length > 0 && (
          <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
            Attached documents
          </p>
        )}
        {invoice.attachmentMeta.length > 0 && invoice.attachmentMeta.map((att, i) => (
          <a
            key={i}
            href={`/api/invoices/${invoice.id}/attachments/${i}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-raised border border-border rounded-[11px] p-[11px_13px] mb-3.5 hover:bg-info-bg transition-colors"
          >
            <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF2F2] flex items-center justify-center shrink-0">
              <FileText size={16} strokeWidth={1.5} className="text-[#FB7171]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#334155] truncate">{att.filename}</p>
              <p className="text-[11.5px] text-[#94A3B8]">{fmtSize(att.size)}</p>
            </div>
            <ExternalLink size={14} strokeWidth={1.5} className="text-dim shrink-0" />
          </a>
        ))}

        {/* Hosted receipt link */}
        {invoice.receiptUrl && (
          <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
            Receipt link
          </p>
        )}
        {invoice.receiptUrl && (
          <a
            href={invoice.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-raised border border-border rounded-[11px] p-[11px_13px] mb-3.5 hover:bg-info-bg transition-colors"
          >
            <div className="w-8.5 h-8.5 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
              <ExternalLink size={16} strokeWidth={1.5} className="text-[#3B6FE0]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#334155]">View hosted receipt</p>
              <p className="text-[11.5px] text-[#94A3B8] truncate">{new URL(invoice.receiptUrl).hostname}</p>
            </div>
          </a>
        )}

        {/* Privacy note */}
        <div className="flex items-center gap-1.75 text-[11.5px] text-[#94A3B8]">
          <Lock size={13} strokeWidth={1.5} className="shrink-0" />
          <span>The file itself is never stored — it&apos;s fetched from Gmail only during an export.</span>
        </div>

        {/* Actions */}
        {!editing && (
          <div className="mt-5.5">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
              Actions
            </p>

            {!invoice.fixedExpense && (
              <button
                type="button"
                onClick={() => setMarkFixedOpen(true)}
                className="w-full flex items-center gap-2.75 bg-info-bg border border-transparent rounded-[11px] p-[11px_13px] mb-2.5 cursor-pointer hover:brightness-[0.98] transition"
              >
                <div className="w-8.5 h-8.5 rounded-lg bg-white/70 flex items-center justify-center shrink-0">
                  <Clock size={16} strokeWidth={1.8} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-semibold text-heading">Mark as fixed expense</p>
                  <p className="text-[11.5px] text-[#94A3B8]">Track this vendor on a recurring schedule</p>
                </div>
                <ChevronRight size={16} strokeWidth={1.8} className="text-[#94A3B8] shrink-0" />
              </button>
            )}

            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => openConfirm("NOT_RELEVANT")}
              className="w-full flex items-center gap-2.75 rounded-[11px] border border-[#FBDCDC] bg-[#FEF6F6] p-[11px_13px] mb-2.5 cursor-pointer hover:bg-[#FDECEC] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-8.5 h-8.5 rounded-lg bg-[#FDE4E4] flex items-center justify-center shrink-0">
                <EyeOff size={16} strokeWidth={1.8} className="text-[#DC2626]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-semibold text-[#DC2626]">Mark as not relevant</p>
                <p className="text-[11.5px] text-[#D08A8A]">Hide from reconciliation and exports</p>
              </div>
            </button>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => openConfirm("NOT_AN_INVOICE")}
              className="w-full flex items-center gap-2.75 rounded-[11px] border border-[#FBDCDC] bg-[#FEF6F6] p-[11px_13px] cursor-pointer hover:bg-[#FDECEC] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-8.5 h-8.5 rounded-lg bg-[#FDE4E4] flex items-center justify-center shrink-0">
                <FileX size={13} strokeWidth={1.8} className="text-[#DC2626]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-semibold text-[#DC2626]">Mark as not an invoice</p>
                <p className="text-[11.5px] text-[#D08A8A]">Reclassify this email as something else</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2.5 px-5.5 py-4 border-t border-[#F1F3F8] shrink-0">
        <div className="flex gap-2.5">
        {editing ? (
          <>
            <Button
              variant="outline"
              className="flex-1"
              disabled={update.isPending}
              onClick={() => {
                setDraft(toDraft(invoice))
                setCategoryDraft(invoice.category)
                setDocumentTypeDraft(invoice.documentType)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gradientLogo"
              className="flex-1"
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
              className="flex-1"
              nativeButton={false}
              render={<a href={invoice.gmailLink} target="_blank" rel="noopener noreferrer" />}
            >
              <ExternalLink size={15} strokeWidth={1.5} />
              Open in Gmail
            </Button>
            <Button
              variant="gradientLogo"
              className="flex-1"
              onClick={() => setEditing(true)}
            >
              Edit fields
            </Button>
          </>
        )}
        </div>
        {!editing && !invoice.fixedExpense && (
          <Button
            variant="ghost"
            onClick={() => setMarkFixedOpen(true)}
          >
            <Repeat size={14} strokeWidth={1.8} />
            Mark as fixed expense
          </Button>
        )}
        {!editing && (
          <div className="flex gap-2.5">
            <Button
              variant="ghostDanger"
              className="flex-1"
              disabled={remove.isPending}
              onClick={() => openConfirm("NOT_RELEVANT")}
            >
              <Trash2 size={14} strokeWidth={1.8} />
              Not relevant
            </Button>
            <Button
              variant="ghostDanger"
              className="flex-1"
              disabled={remove.isPending}
              onClick={() => openConfirm("NOT_AN_INVOICE")}
            >
              <Ban size={14} strokeWidth={1.8} />
              This isn&apos;t an invoice
            </Button>
          </div>
        )}
      </div>

      {/* Removal confirmation */}
      {confirmReason !== null && (
        <ConfirmationDialog
          open
          onOpenChange={() =>setConfirmReason(null) }
          title={confirmReason === "NOT_AN_INVOICE" ? "Mark as not an invoice?" : "Remove this invoice?"}
          description={
            confirmReason === "NOT_AN_INVOICE"
              ? "It's removed from your list and similar emails from this sender are detected less often. You can undo this."
              : "It genuinely is an invoice but won't appear in your list. You can undo this."
          }
          confirmLabel="Remove"
          pendingLabel="Removing…"
          destructive
          isPending={remove.isPending}
          onConfirm={handleRemove}
        >
          {confirmReason === "NOT_RELEVANT" && (
            <Label
              htmlFor="mute-sender"
              className="flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer"
            >
              <Checkbox
                id="mute-sender"
                checked={muteSender}
                onCheckedChange={(checked) => setMuteSender(checked === true)}
              />
              Also stop showing invoices from this sender
            </Label>
          )}
        </ConfirmationDialog>
      )}

      {/* Mark as fixed expense — pre-filled from this invoice, links it on save */}
      {markFixedOpen && <Dialog name="invoice_mark_fixed" open onOpenChange={(open) => { if (!open) setMarkFixedOpen(false) }}>
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
      </Dialog>}

      {/* Remove this invoice from its fixed expense */}
      {unlinkOpen && (
        <ConfirmationDialog
          open
          onOpenChange={(open) => { if (!open) setUnlinkOpen(false) }}
          title="Remove from fixed expense?"
          description={
            <>
              This invoice will no longer count toward
              {invoice.fixedExpense ? ` “${invoice.fixedExpense.name}”` : " this fixed expense"}.
              The fixed expense keeps its match rules, so a matching invoice can re-link later.
            </>
          }
          confirmLabel="Remove"
          pendingLabel="Removing…"
          destructive
          isPending={unlinkPending}
          onConfirm={handleUnlink}
        >
          {confirmReason === "NOT_RELEVANT" && (
            <Label
              htmlFor="mute-sender"
              className="flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer"
            >
              <Checkbox
                id="mute-sender"
                checked={muteSender}
                onCheckedChange={(checked) => setMuteSender(checked === true)}
              />
              Also stop showing invoices from this sender
            </Label>
          )}
        </ConfirmationDialog>
      )}
    </SheetContent>
  )
}
