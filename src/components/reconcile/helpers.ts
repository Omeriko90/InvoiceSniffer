import type { TransactionRow } from "@/components/reconcile/types"

// Re-exported for existing importers; canonical impl lives in @/lib/date.
export { fmtDate } from "@/lib/date"

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
