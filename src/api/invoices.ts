import type { InvoiceCategory } from "@/lib/invoice-categories"

export type UpdateInvoicePayload = {
  vendorName?: string | null
  invoiceNumber?: string | null
  totalAmount?: string
  invoiceDate?: string | null
  dueDate?: string | null
  category?: InvoiceCategory
}

export type RemovalReason = "NOT_RELEVANT" | "NOT_AN_INVOICE"

async function updateInvoice({ id, data }: { id: string; data: UpdateInvoicePayload }): Promise<void> {
  const res = await fetch(`/api/invoices/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to update invoice")
  }
}

async function removeInvoice({
  id,
  reason,
  muteSender,
}: {
  id: string
  reason: RemovalReason
  muteSender?: boolean
}): Promise<void> {
  const res = await fetch(`/api/invoices/${id}/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(muteSender ? { reason, muteSender } : { reason }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to remove invoice")
  }
}

async function restoreInvoice(id: string): Promise<void> {
  const res = await fetch(`/api/invoices/${id}/restore`, { method: "POST" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to restore invoice")
  }
}

// Detach an invoice from its fixed expense (clears fixedExpenseId).
async function unlinkFixedExpense(id: string): Promise<void> {
  const res = await fetch(`/api/invoices/${id}/unlink-fixed-expense`, { method: "POST" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to unlink invoice")
  }
}

export { updateInvoice, removeInvoice, restoreInvoice, unlinkFixedExpense }
