// Client component by import — only ever rendered from <FindInvoiceModal>.
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CandidateRow } from "@/components/reconcile/CandidateRow"
import { queries } from "@/queries"
import type { CandidateResult } from "@/api-types/reconcile"
import type { TransactionRow } from "@/components/reconcile/types"

function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export function CandidateList({
  transaction,
  range,
  search,
  disabled,
  onLink,
}: {
  transaction: TransactionRow
  range: { from: string; to: string }
  search: string
  disabled: boolean
  onLink: (candidate: CandidateResult) => void
}) {
  const q = useDebounced(search, 250)
  const charge = {
    merchant: transaction.merchant,
    amount: transaction.amount,
    date: transaction.date,
    currency: transaction.currency,
  }
  const candidates = useQuery(queries.reconcile.candidates(charge, range, q))

  return (
    <div className="flex flex-col gap-[8px] max-h-[320px] overflow-y-auto">
      {candidates.isLoading && (
        <p className="text-[13px] text-dim py-6 text-center">Searching…</p>
      )}
      {candidates.data?.length === 0 && (
        <p className="text-[13px] text-dim py-6 text-center">
          No invoices match — try a different search.
        </p>
      )}
      {candidates.data?.map((c) => (
        <CandidateRow
          key={c.invoiceId}
          candidate={c}
          disabled={disabled}
          onLink={() => onLink(c)}
        />
      ))}
    </div>
  )
}
