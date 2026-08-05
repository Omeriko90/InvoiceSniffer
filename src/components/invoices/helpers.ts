import { fmtMoney } from "@/lib/money"
import { VENDOR_GRADIENTS } from "./constants"
import type { InvoiceRow } from "./types"

export function vendorGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff
  return VENDOR_GRADIENTS[Math.abs(hash) % VENDOR_GRADIENTS.length]
}

export function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase()
}

export function fmtAmount(amount: string, currency: string): string {
  // Delegates to fmtMoney, which normalizes symbol "currencies" ("₪" → "ILS")
  // and falls back gracefully — a raw symbol would otherwise throw in Intl.
  return fmtMoney(amount, currency)
}


// Token bar-fill class for the extraction-confidence progress indicator,
// mirroring reconcile/status.tsx's `bar` classes.
export function confidenceBarClass(pct: number): string {
  if (pct >= 0.9) return "bg-success"
  if (pct >= 0.75) return "bg-warning"
  return "bg-danger"
}

// The date an invoice "belongs to" for month scoping: its issue date when known,
// else the email received date. Lets a Jul-issued/Aug-received invoice count as July.
export function belongsToDate(inv: Pick<InvoiceRow, "invoiceDate" | "emailDate">): Date {
  return new Date(inv.invoiceDate ?? inv.emailDate)
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function toDraft(inv: InvoiceRow) {
  return {
    vendorName: inv.vendorName ?? "",
    invoiceNumber: inv.invoiceNumber ?? "",
    totalAmount: inv.totalAmount,
    invoiceDate: inv.invoiceDate?.slice(0, 10) ?? "",
    dueDate: inv.dueDate?.slice(0, 10) ?? "",
  }
}
