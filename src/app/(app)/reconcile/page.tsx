import { ReconcileSession } from "@/components/reconcile/ReconcileSession"

// Reconcile is an ephemeral session: the user picks a date range, adds one or
// more CSVs, and matches them against invoices in memory. Nothing about the
// transactions is persisted — see ReconcileSession + /api/reconcile/*.
export default function ReconcilePage() {
  return <ReconcileSession />
}
