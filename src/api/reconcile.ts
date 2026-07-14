import type {
  CandidateResult,
  MatchRequest,
  MatchResponse,
  ReconcileAction,
} from "@/api-types/reconcile"

// Run an ephemeral reconcile session: post the uploaded rows + date range, get
// matches back. Nothing is persisted server-side by this call.
export async function fetchMatch(body: MatchRequest): Promise<MatchResponse> {
  const res = await fetch("/api/reconcile/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error ?? "Failed to reconcile")
  }
  return res.json()
}

// Persist a correction: learned alias + (for confirm/link) the invoice's
// reconciled state and provenance.
export async function reconcileAction(action: ReconcileAction): Promise<void> {
  const res = await fetch("/api/reconcile/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? "Failed to update")
  }
}

// Candidate invoices for the Find Invoice modal, scoped to the session range.
export async function fetchCandidates(
  charge: { merchant: string; amount: string; date: string; currency: string },
  range: { from: string; to: string },
  q: string
): Promise<CandidateResult[]> {
  const params = new URLSearchParams({
    merchant: charge.merchant,
    amount: charge.amount,
    date: charge.date,
    currency: charge.currency,
    from: range.from,
    to: range.to,
  })
  if (q) params.set("q", q)
  const res = await fetch(`/api/reconcile/candidates?${params.toString()}`)
  if (!res.ok) throw new Error("Failed to load suggestions")
  return res.json()
}
