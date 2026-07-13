// Client component by import — only ever rendered from <InvoicesClient>.
import { format } from "date-fns"
import { STATUS_META, TABLE_GRID_COLUMNS } from "./constants"
import { fmtAmount } from "./helpers"
import type { InvoiceRow as InvoiceRowType } from "./types"
import { VendorCell } from "./VendorCell"
import { ConfidenceCell } from "./ConfidenceCell"
import { StatusBadge } from "./StatusBadge"
import { GmailLinkButton } from "./GmailLinkButton"

export function InvoiceRow({ invoice, onSelect }: {
  invoice: InvoiceRowType
  onSelect: (invoice: InvoiceRowType) => void
}) {
  const vendor = invoice.vendorName ?? invoice.senderName ?? invoice.senderEmail
  const status = STATUS_META[invoice.status] ?? STATUS_META.DETECTED

  return (
    <div
      onClick={() => onSelect(invoice)}
      className="grid items-center px-[18px] py-[13px] border-b border-[#F1F3F8] cursor-pointer hover:bg-[#FAFBFF] transition-colors last:border-b-0"
      style={{ gridTemplateColumns: TABLE_GRID_COLUMNS, gap: "12px" }}
    >
      {/* Vendor */}
      <div className="flex items-center gap-[10px] min-w-0">
        <VendorCell vendor={vendor} />
        <span className="text-[13.5px] font-[600] text-[#334155] truncate">{vendor}</span>
      </div>

      {/* Invoice # */}
      <span className="text-[13px] text-[#64748B] font-mono truncate">
        {invoice.invoiceNumber ?? "—"}
      </span>

      {/* Amount */}
      <span className="text-[13.5px] font-[700] text-heading text-right">
        {fmtAmount(invoice.totalAmount, invoice.currency)}
      </span>

      {/* Date */}
      <span className="text-[13px] text-[#64748B]">
        {format(new Date(invoice.emailDate), "MMM d")}
      </span>

      {/* Confidence */}
      <ConfidenceCell confidence={invoice.extractionConfidence} />

      {/* Status */}
      <div>
        <StatusBadge status={status} />
      </div>

      {/* Gmail link */}
      <GmailLinkButton gmailLink={invoice.gmailLink} />
    </div>
  )
}
