// Wire types for the ephemeral reconcile session. Transactions are never
// persisted — the client holds parsed rows, posts them to /api/reconcile/match,
// and renders the returned results. Durable side effects (invoice status +
// provenance, learned aliases) go through /api/reconcile/action.

export type ReconcileStatus = "UNMATCHED" | "POSSIBLE" | "MATCHED" | "NO_INVOICE"

export type MatchInvoice = {
  id: string
  vendorName: string | null
  invoiceNumber: string | null
  amount: string
  currency: string
  date: string
  dueDate: string | null
  senderEmail: string
  gmailLink: string
  status: string
  reconciledSourceFile: string | null
  reconciledAt: string | null
}

// Shaped to match the reconcile table's row (see components/reconcile/types.ts,
// which aliases TransactionRow to this) so the presentational components are
// reused unchanged.
export type MatchRow = {
  id: string
  date: string
  merchant: string
  amount: string
  currency: string
  status: ReconcileStatus
  matchConfidence: number | null
  matchReason: string | null
  matchConfirmed: boolean
  sourceFile: string | null
  // Assigned invoice was already reconciled in a prior session — a warning, not
  // a silent re-match.
  collision: boolean
  invoice: MatchInvoice | null
}

export type MatchSummary = {
  charges: number
  matched: number
  possible: number
  chargesMissingInvoice: number
  invoicesMissingCharge: number
  collisions: number
}

export type MatchResponse = {
  results: MatchRow[]
  unreconciledInvoices: MatchInvoice[]
  summary: MatchSummary
}

export type SessionFileInput = {
  fileName: string
  rows: { date: string; merchant: string; amount: number; currency?: string }[]
}

import type { DateRangePreset } from "@/lib/date-range"

export type DateRangeScope = { preset: DateRangePreset } | { from: string; to: string }

export type MatchRequest = {
  dateRange: DateRangeScope
  files: SessionFileInput[]
}

// User corrections. They persist only learned aliases + the invoice's reconciled
// state/provenance — never a transaction row.
export type ReconcileAction =
  | { action: "confirm"; merchant: string; invoiceId: string; sourceFile?: string }
  | { action: "link"; merchant: string; invoiceId: string; sourceFile?: string }
  | { action: "reject"; merchant: string; invoiceId: string }
  | { action: "no_invoice"; merchant: string }
  | { action: "undo"; merchant: string; invoiceId?: string; previousInvoiceStatus?: string }

export type CandidateResult = {
  invoiceId: string
  vendorName: string | null
  invoiceNumber: string | null
  amount: number
  currency: string
  date: string
  dueDate: string | null
  senderEmail: string
  gmailLink: string
  status: string
  confidence: number | null
  reason: string
  nameScore: number
}
