// Client component by import — only ever rendered from <InvoicesClient>.
import { fmtDateShort } from "@/lib/date"
import { fmtDisplayMoney } from "@/lib/money"
import { TABLE_GRID_COLUMNS } from "./constants"
import type { InvoiceRow as InvoiceRowType } from "./types"
import { VendorCell } from "./VendorCell"
import { CategoryBadge } from "./CategoryBadge"
import { DocumentTypeBadge } from "./DocumentTypeBadge"
import { GmailLinkButton } from "./GmailLinkButton"

export function InvoiceRow({ invoice, onSelect }: {
  invoice: InvoiceRowType
  onSelect: (invoice: InvoiceRowType) => void
}) {
  const vendor = invoice.vendorName ?? invoice.senderName ?? invoice.senderEmail

  return (
    <div
      onClick={() => onSelect(invoice)}
      className="grid items-center px-4.5 py-3 border-b border-hover cursor-pointer hover:bg-background transition-colors last:border-b-0"
      style={{ gridTemplateColumns: TABLE_GRID_COLUMNS, gap: "12px" }}
    >
      {/* Vendor */}
      <div className="flex items-center gap-2.5 min-w-0">
        <VendorCell vendor={vendor} />
        <span className="text-sm font-semibold text-foreground truncate">{vendor}</span>
      </div>

      {/* Invoice # */}
      <span className="text-sm text-text-secondary font-mono truncate">
        {invoice.invoiceNumber ?? "—"}
      </span>

      {/* Issue date */}
      <span className="text-sm text-text-secondary">
        {invoice.invoiceDate ? fmtDateShort(invoice.invoiceDate) : "—"}
      </span>

      {/* Date */}
      <span className="text-sm text-text-secondary">
        {fmtDateShort(invoice.emailDate)}
      </span>

      {/* Category */}
      <div className="min-w-0">
        <CategoryBadge category={invoice.category} />
      </div>

      {/* Amount (shown in the org display currency) */}
      <span className="text-sm font-bold text-heading text-right">
        {fmtDisplayMoney(invoice)}
      </span>

      {/* Gmail link */}
      <GmailLinkButton gmailLink={invoice.gmailLink} />
    </div>
  )
}
