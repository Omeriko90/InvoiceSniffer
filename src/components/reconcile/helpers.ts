import { format } from "date-fns"
import type { TransactionRow } from "@/components/reconcile/types"

export function invoiceLabel(txn: TransactionRow): { text: string; muted: boolean } {
  if (txn.invoice) {
    const vendor = txn.invoice.vendorName ?? "Unknown vendor"
    return {
      text: txn.invoice.invoiceNumber ? `${vendor} — ${txn.invoice.invoiceNumber}` : vendor,
      muted: false,
    }
  }
  if (txn.status === "NO_INVOICE") return { text: "No invoice required", muted: true }
  return { text: "No invoice found", muted: true }
}

export function fmtDate(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy")
}
