import { format } from "date-fns"
import { REJECTED_REASON, USER_NO_INVOICE_REASON } from "@/lib/matching"
import type { RunAction, TransactionRow } from "@/components/reconcile/types"

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

// Optimistic mirror of the server-side transitions in the transaction PATCH
// route. Kept intentionally in lockstep with that handler.
export function applyOptimisticAction(txn: TransactionRow, action: RunAction): TransactionRow {
  switch (action) {
    case "confirm":
      return { ...txn, status: "MATCHED", matchConfirmed: true }
    case "reject":
      return {
        ...txn,
        status: "UNMATCHED",
        matchConfirmed: false,
        matchConfidence: null,
        matchReason: REJECTED_REASON,
        invoice: null,
      }
    case "no_invoice":
      return {
        ...txn,
        status: "NO_INVOICE",
        matchConfirmed: false,
        matchConfidence: null,
        matchReason: USER_NO_INVOICE_REASON,
        invoice: null,
      }
    case "undo":
      return {
        ...txn,
        status: "UNMATCHED",
        matchConfirmed: false,
        matchConfidence: null,
        matchReason: null,
        invoice: null,
      }
  }
}
