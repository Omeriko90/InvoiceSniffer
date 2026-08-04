import type { InvoiceCategory } from "@/lib/invoice-categories"
import type { FixedExpenseFrequency, FixedExpenseStatus } from "@/lib/fixed-expense-meta"
import type {
  FixedExpenseCandidate,
  FixedExpenseListItem,
  FixedExpenseTimelineResponse,
} from "@/components/fixed-expenses/types"

export type CreateFixedExpensePayload = {
  name: string
  category: InvoiceCategory
  vendorName?: string[]
  senderEmail?: string[]
  gmailCredentialId?: string | null
  expectedAmount?: string | null
  currency: string
  frequency: FixedExpenseFrequency
  anchorDate: string
  gracePeriodDays: number
  // Drawer flow: link this invoice to the new expense on create.
  linkInvoiceId?: string
}

export type UpdateFixedExpensePayload = Partial<Omit<CreateFixedExpensePayload, "linkInvoiceId">> & {
  status?: FixedExpenseStatus
}

async function createFixedExpense(payload: CreateFixedExpensePayload): Promise<{ id: string }> {
  const res = await fetch("/api/fixed-expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to create fixed expense")
  }
  return res.json()
}

async function updateFixedExpense({
  id,
  data,
}: {
  id: string
  data: UpdateFixedExpensePayload
}): Promise<void> {
  const res = await fetch(`/api/fixed-expenses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to update fixed expense")
  }
}

async function deleteFixedExpense(id: string): Promise<void> {
  const res = await fetch(`/api/fixed-expenses/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to delete fixed expense")
  }
}

async function linkInvoiceToFixedExpense({
  id,
  invoiceId,
}: {
  id: string
  invoiceId: string
}): Promise<void> {
  const res = await fetch(`/api/fixed-expenses/${id}/link-invoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to link invoice")
  }
}

// List the org's fixed expenses for the invoice-drawer "link to existing" dropdown.
async function fetchFixedExpenses(): Promise<{ expenses: FixedExpenseListItem[] }> {
  const res = await fetch("/api/fixed-expenses")
  if (!res.ok) throw new Error("Failed to load fixed expenses")
  return res.json()
}

// Absorb an invoice into an existing expense: teaches the expense this invoice's
// vendor title + sender and links all matching invoices (past + future).
async function absorbInvoiceIntoFixedExpense({
  id,
  invoiceId,
}: {
  id: string
  invoiceId: string
}): Promise<void> {
  const res = await fetch(`/api/fixed-expenses/${id}/absorb-invoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to link invoice")
  }
}

async function fetchFixedExpenseTimeline({
  id,
  offset,
  limit,
}: {
  id: string
  offset: number
  limit?: number
}): Promise<FixedExpenseTimelineResponse> {
  const params = new URLSearchParams({ offset: String(offset) })
  if (limit) params.set("limit", String(limit))
  const res = await fetch(`/api/fixed-expenses/${id}/timeline?${params}`)
  if (!res.ok) throw new Error("Failed to load timeline")
  return res.json()
}

async function fetchFixedExpenseCandidates(id: string): Promise<{ candidates: FixedExpenseCandidate[] }> {
  const res = await fetch(`/api/fixed-expenses/${id}/candidates`)
  if (!res.ok) throw new Error("Failed to load candidates")
  return res.json()
}

export {
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  linkInvoiceToFixedExpense,
  absorbInvoiceIntoFixedExpense,
  fetchFixedExpenses,
  fetchFixedExpenseTimeline,
  fetchFixedExpenseCandidates,
}
