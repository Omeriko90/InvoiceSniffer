import type { TxnStatus } from "@/components/reconcile/status"

export type TransactionRow = {
  id: string
  date: string
  merchant: string
  amount: string
  currency: string
  status: TxnStatus
  matchConfidence: number | null
  matchReason: string | null
  matchConfirmed: boolean
  sourceFile: string | null
  invoice: {
    id: string
    vendorName: string | null
    invoiceNumber: string | null
    amount: string
    currency: string
    date: string
    dueDate: string | null
    senderEmail: string
    gmailLink: string
  } | null
}

export type TabId = "all" | "matched" | "possible" | "missing" | "none"

export type RunAction = "confirm" | "reject" | "no_invoice" | "undo"
