import type { InvoiceCategory } from "@/lib/invoice-categories"
import type { FixedExpenseFrequency, FixedExpenseStatus } from "@/lib/fixed-expense-meta"
import type { FixedExpensePeriodStatus } from "@/lib/fixed-expenses"

// A fixed expense as sent to the client (Decimal/Date serialized to strings),
// with the current-period arrival status computed server-side.
export type FixedExpenseRow = {
  id: string
  name: string
  category: InvoiceCategory
  // Match signals — arrays now (an expense can absorb several vendor titles /
  // sender emails; see the invoice-drawer "link to existing" flow).
  vendorName: string[]
  senderEmail: string[]
  gmailCredentialId: string | null
  expectedAmount: string | null
  currency: string
  frequency: FixedExpenseFrequency
  anchorDate: string
  gracePeriodDays: number
  status: FixedExpenseStatus
  createdAt: string
  // Arrival status for the current period (ARRIVED / PENDING / OVERDUE).
  currentStatus: FixedExpensePeriodStatus
  // Mailbox the expense is pinned to, if any.
  sourceAccount: { email: string; label: string | null } | null
}

// Lightweight fixed expense as returned by GET /api/fixed-expenses — powers the
// invoice-drawer "link to an existing expense" dropdown (no computed status).
export type FixedExpenseListItem = Omit<FixedExpenseRow, "currentStatus" | "createdAt" | "sourceAccount">

// One entry in the detail-drawer timeline: a period + whether its invoice arrived.
export type FixedExpenseTimelineEntry = {
  index: number
  periodStart: string
  periodEnd: string
  status: FixedExpensePeriodStatus
  invoice: {
    id: string
    vendorName: string | null
    totalAmount: string
    currency: string
    emailDate: string
  } | null
}

export type FixedExpenseTimelineResponse = {
  entries: FixedExpenseTimelineEntry[]
  hasMore: boolean
}

// An unlinked invoice offered when manually linking a "Missing" period.
export type FixedExpenseCandidate = {
  id: string
  vendorName: string | null
  totalAmount: string
  currency: string
  emailDate: string
}
