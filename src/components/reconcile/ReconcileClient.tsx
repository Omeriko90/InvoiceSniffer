"use client"

import { useMemo, useState, useOptimistic, startTransition } from "react"
import { useTransactionAction } from "@/hooks/useTransactionAction"
import { FindInvoiceModal } from "@/components/reconcile/FindInvoiceModal"
import { MatchDrawer } from "@/components/reconcile/MatchDrawer"
import { TabBar } from "@/components/reconcile/TabBar"
import { ReconcileTable } from "@/components/reconcile/ReconcileTable"
import { TAB_FOR_STATUS } from "@/components/reconcile/constants"
import { applyOptimisticAction } from "@/components/reconcile/helpers"
import type { RunAction, TabId, TransactionRow } from "@/components/reconcile/types"

export function ReconcileClient({ transactions }: { transactions: TransactionRow[] }) {
  const [tab, setTab] = useState<TabId>("all")
  const [findFor, setFindFor] = useState<TransactionRow | null>(null)
  const [detailFor, setDetailFor] = useState<TransactionRow | null>(null)
  const action = useTransactionAction()

  // Optimistic overlay: reflect an action instantly, then reconcile with the
  // fresh server props that arrive via router.refresh() inside the transition.
  const [optimisticTxns, applyOptimistic] = useOptimistic(
    transactions,
    (state: TransactionRow[], patch: { id: string; action: RunAction }) =>
      state.map((t) => (t.id === patch.id ? applyOptimisticAction(t, patch.action) : t))
  )

  // Keep the open drawer in sync with the (optimistic) transaction data
  const detailTxn = detailFor
    ? optimisticTxns.find((t) => t.id === detailFor.id) ?? null
    : null

  const tabs = useMemo(() => {
    const count = (t: TabId) =>
      optimisticTxns.filter((txn) => TAB_FOR_STATUS[txn.status] === t).length
    return [
      { id: "all" as TabId, label: "All", count: optimisticTxns.length },
      { id: "matched" as TabId, label: "Matched", count: count("matched") },
      { id: "possible" as TabId, label: "Possible", count: count("possible") },
      { id: "missing" as TabId, label: "Missing", count: count("missing") },
      { id: "none" as TabId, label: "No invoice", count: count("none") },
    ]
  }, [optimisticTxns])

  const filtered = tab === "all"
    ? optimisticTxns
    : optimisticTxns.filter((txn) => TAB_FOR_STATUS[txn.status] === tab)

  const run = (id: string, a: RunAction) => {
    startTransition(async () => {
      applyOptimistic({ id, action: a })
      // Errors surface via the hook's toast; the optimistic state auto-reverts.
      await action.mutateAsync({ id, action: a }).catch(() => {})
    })
  }

  const pending = (id: string) => action.isPending && action.variables?.id === id

  return (
    <div className="flex flex-col">
      {/* Status tabs */}
      <TabBar tabs={tabs} tab={tab} onSelect={setTab} />

      {/* Table */}
      <ReconcileTable
        transactions={optimisticTxns}
        filtered={filtered}
        pending={pending}
        onOpen={setDetailFor}
        onFind={setFindFor}
        onRun={run}
      />

      {/* Match confirmation drawer */}
      <MatchDrawer
        transaction={detailTxn}
        onClose={() => setDetailFor(null)}
        onRun={run}
        onFind={(txn) => {
          setDetailFor(null)
          setFindFor(txn)
        }}
        pending={action.isPending}
      />

      {/* Find / change invoice modal */}
      <FindInvoiceModal transaction={findFor} onClose={() => setFindFor(null)} />
    </div>
  )
}
