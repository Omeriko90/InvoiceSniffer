import React from "react"
import { SheetTitle } from "@/components/ui/sheet"
import { VendorCell } from "../VendorCell"
import type { InvoiceRow } from "../types"



interface InvoiceDetailDrawerHeaderProps {
  vendor: string
  invoice: InvoiceRow
  
}
export function InvoiceDetailDrawerHeader({ vendor, invoice }: InvoiceDetailDrawerHeaderProps) {
  return (
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

    
  )
}