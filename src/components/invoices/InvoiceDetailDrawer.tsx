// Client component by import — only ever rendered from <InvoicesClient>.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, ExternalLink, FileText, Lock } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useUpdateInvoice } from "@/hooks/useUpdateInvoice"
import { useMarkNotInvoice } from "@/hooks/useMarkNotInvoice"
import { STATUS_META } from "./constants"
import { fmtAmount, fmtSize, toDraft } from "./helpers"
import type { InvoiceRow } from "./types"
import { VendorCell } from "./VendorCell"
import { StatusBadge } from "./StatusBadge"

export function InvoiceDetailDrawer({ invoice, onSaved, onDismiss }: {
  invoice: InvoiceRow
  onSaved: (updated: InvoiceRow) => void
  onDismiss: () => void
}) {
  const router = useRouter()
  const update = useUpdateInvoice()
  const notInvoice = useMarkNotInvoice()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => toDraft(invoice))

  const vendor = invoice.vendorName ?? invoice.senderName ?? invoice.senderEmail
  const status = STATUS_META[invoice.status] ?? STATUS_META.DETECTED
  const pct = Math.round(invoice.extractionConfidence * 100)

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
        </div>
        <p className="text-[12.5px] text-[#94A3B8] mb-6">
          Extraction confidence: {pct}%
        </p>

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
        </div>
        ) : (
        <div className="border border-[#E8EDFA] rounded-[11px] overflow-hidden mb-[22px]">
          {[
            { label: "Invoice #", value: invoice.invoiceNumber ?? "—", mono: true },
            { label: "Amount",    value: fmtAmount(invoice.totalAmount, invoice.currency) },
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
        {!editing && invoice.status !== "IGNORED" && (
          <Button
            variant="ghost"
            className="h-auto py-[8px] rounded-[10px] text-[13px] font-[600] text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2]"
            disabled={notInvoice.isPending}
            onClick={() =>
              notInvoice.mutate(invoice.id, {
                onSuccess: () => {
                  onDismiss()
                  router.refresh()
                },
              })
            }
          >
            <Ban size={14} strokeWidth={1.8} />
            {notInvoice.isPending ? "Marking…" : "This isn't an invoice"}
          </Button>
        )}
      </div>
    </SheetContent>
  )
}
