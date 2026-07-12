import type { CandidateResult, TransactionAction } from "@/api-types/reconcile"

export async function transactionAction({
  id,
  ...action
}: { id: string } & TransactionAction): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to update transaction")
  }
}

export async function fetchCandidates(id: string, q: string): Promise<CandidateResult[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : ""
  const res = await fetch(`/api/transactions/${id}/candidates${params}`)
  if (!res.ok) throw new Error("Failed to load suggestions")
  return res.json()
}
