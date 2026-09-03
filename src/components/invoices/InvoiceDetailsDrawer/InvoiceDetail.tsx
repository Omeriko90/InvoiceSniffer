import { type ReactNode } from "react"
import { ChevronRight, Clock, ExternalLink, EyeOff, FileText, FileX, Lock, Repeat, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { fmtMoney, fmtDisplayMoney, hasDistinctOriginal } from "@/lib/money"
import { fmtAmount, fmtSize } from "../helpers"
import type { InvoiceRow } from "../types"
import { CategoryBadge } from "../CategoryBadge"
import { DocumentTypeBadge } from "../DocumentTypeBadge"
import { RemovalReason } from "@/api/invoices"

interface InvoiceDetailProps {
  invoice: InvoiceRow
  onUnlinkFixedExpense: () => void
  unlinkPending: boolean
  onEdit: () => void
  onMarkFixedExpense: () => void
  isPending: boolean
  onOpenConfirm: (reason: RemovalReason) => void
}
export function InvoiceDetail({ invoice, onUnlinkFixedExpense, unlinkPending, onEdit, onMarkFixedExpense, isPending, onOpenConfirm }: InvoiceDetailProps) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-5.5">
        <div className="mb-5">
          <span className="text-3xl font-bold text-heading tracking-tight leading-none">
            {fmtDisplayMoney(invoice)}
          </span>
        </div>

        {invoice.fixedExpense && (
          <div className="flex items-center gap-1.75 -mt-2 mb-6 px-2.75 py-2 rounded-lg bg-info-bg">
            <Repeat size={14} strokeWidth={1.8} className="text-primary shrink-0" />
            <span className="text-sm font-semibold text-text-primary truncate">
              Fixed expense · {invoice.fixedExpense.name}
            </span>
            <button
              type="button"
              onClick={onUnlinkFixedExpense}
              disabled={unlinkPending}
              className="ml-auto shrink-0 text-[#94A3B8] hover:text-[#DC2626] disabled:opacity-50"
              aria-label="Remove from fixed expense"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        )}

        <p className="text-base font-bold text-text-secondary mb-2">
          Details
        </p>
        
        <div className="border border-[#E8EDFA] rounded-[11px] overflow-hidden mb-5.5">
          {([
            { label: "Type",     node: <DocumentTypeBadge documentType={invoice.documentType} /> },
            { label: "Category",  node: <CategoryBadge category={invoice.category} /> },
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
          ] as { label: string; value?: string; mono?: boolean; node?: ReactNode }[]).map((row, i, arr) => (
            <div
              key={row.label}
              className={cn(
                "flex items-center justify-between px-[13px] py-2.5 text-sm",
                i < arr.length - 1 && "border-b border-hover",
              )}
            >
              <span className="text-text-secondary">{row.label}</span>
              {row.node ?? (
                <span
                  className="font-semibold text-text-primary"
                  style={row.mono ? { fontFamily: "var(--font-mono)" } : undefined}
                >
                  {row.value}
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="text-base font-bold text-text-secondary mb-2">
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
          <p className="text-base font-bold text-text-secondary mb-2">
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
          <p className="text-[11px] font-bold text-[#64748B] mb-2">
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
        
          <div className="mt-5.5">
            <p className="text-base font-bold text-text-secondary mb-2">
              Actions
            </p>

            {!invoice.fixedExpense && (
              <button
                type="button"
                onClick={onMarkFixedExpense}
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
              disabled={isPending}
              onClick={() => onOpenConfirm("NOT_RELEVANT")}
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
              disabled={isPending}
              onClick={() => onOpenConfirm("NOT_AN_INVOICE")}
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
        
      </div>

      <div className="flex flex-col gap-2.5 px-5.5 py-6 border-t border-secondary shrink-0">
        <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="flex-1"
              size="xl"
              nativeButton={false}
              render={<a href={invoice.gmailLink} target="_blank" rel="noopener noreferrer" />}
            >
              <ExternalLink size={15} strokeWidth={1.5} />
              Open in Gmail
            </Button>
            <Button
              className="flex-1"
              size="xl"
              onClick={onEdit}
            >
              Edit fields
            </Button>
        </div>
      </div>
    </div>
  )
}