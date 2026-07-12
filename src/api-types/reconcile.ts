export type CandidateResult = {
  invoiceId: string
  vendorName: string | null
  invoiceNumber: string | null
  amount: number
  currency: string
  date: string
  confidence: number | null
  reason: string
  nameScore: number
}

export type TransactionAction =
  | { action: "confirm" }
  | { action: "reject" }
  | { action: "no_invoice" }
  | { action: "undo" }
  | { action: "link"; invoiceId: string }
