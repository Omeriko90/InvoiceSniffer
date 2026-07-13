// Client component by import — only ever rendered from <FindInvoiceModal>.
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CandidateRow } from "@/components/reconcile/CandidateRow"
import { queries } from "@/queries"
import { useTransactionAction } from "@/hooks/useTransactionAction"
import type { TransactionRow } from "@/components/reconcile/types"

function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export function CandidateList({ transaction, search, onLinked }: {
  transaction: TransactionRow
  search: string
  onLinked: () => void
}) {
  const action = useTransactionAction()
  const q = useDebounced(search, 250)
  const candidates = useQuery(queries.reconcile.candidates(transaction.id, q))

  return (
    <div className="flex flex-col gap-[8px] max-h-[320px] overflow-y-auto">
      {candidates.isLoading && (
        <p className="text-[13px] text-[#94A3B8] py-6 text-center">Searching…</p>
      )}
      {candidates.data?.length === 0 && (
        <p className="text-[13px] text-[#94A3B8] py-6 text-center">
          No invoices match — try a different search.
        </p>
      )}
      {candidates.data?.map((c) => (
        <CandidateRow
          key={c.invoiceId}
          candidate={c}
          disabled={action.isPending}
          onLink={() =>
            action.mutate(
              { id: transaction.id, action: "link", invoiceId: c.invoiceId },
              { onSuccess: onLinked }
            )
          }
        />
      ))}
    </div>
  )
}
