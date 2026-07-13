"use client"

import { useMemo, useState } from "react"
import { useTransactionAction } from "@/hooks/useTransactionAction"
import { FindInvoiceModal } from "@/components/reconcile/FindInvoiceModal"
import { MatchDrawer } from "@/components/reconcile/MatchDrawer"
import { TabBar } from "@/components/reconcile/TabBar"
import { ReconcileTable } from "@/components/reconcile/ReconcileTable"
import { TAB_FOR_STATUS } from "@/components/reconcile/constants"
import type { RunAction, TabId, TransactionRow } from "@/components/reconcile/types"

export function ReconcileClient({ transactions }: { transactions: TransactionRow[] }) {
  const [tab, setTab] = useState<TabId>("all")
  const [findFor, setFindFor] = useState<TransactionRow | null>(null)
  const [detailFor, setDetailFor] = useState<TransactionRow | null>(null)
  const action = useTransactionAction()

  // Keep the open drawer in sync with fresh transaction data after an action
  const detailTxn = detailFor
    ? transactions.find((t) => t.id === detailFor.id) ?? null
    : null

  const tabs = useMemo(() => {
    const count = (t: TabId) =>
      transactions.filter((txn) => TAB_FOR_STATUS[txn.status] === t).length
    return [
      { id: "all" as TabId, label: "All", count: transactions.length },
      { id: "matched" as TabId, label: "Matched", count: count("matched") },
      { id: "possible" as TabId, label: "Possible", count: count("possible") },
      { id: "missing" as TabId, label: "Missing", count: count("missing") },
      { id: "none" as TabId, label: "No invoice", count: count("none") },
    ]
  }, [transactions])

  const filtered = tab === "all"
    ? transactions
    : transactions.filter((txn) => TAB_FOR_STATUS[txn.status] === tab)

  const run = (id: string, a: RunAction) =>
    action.mutate({ id, action: a })

  const pending = (id: string) => action.isPending && action.variables?.id === id

  return (
    <div className="flex flex-col">
      {/* Status tabs */}
      <TabBar tabs={tabs} tab={tab} onSelect={setTab} />

      {/* Table */}
      <ReconcileTable
        transactions={transactions}
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
