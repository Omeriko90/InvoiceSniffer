export type UpdateInvoicePayload = {
  vendorName?: string | null
  invoiceNumber?: string | null
  totalAmount?: string
  invoiceDate?: string | null
  dueDate?: string | null
}

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

export { updateInvoice }
