// Client component by import — only ever rendered from ReconcileSession
import { Dialog } from "@/components/ui/dialog"
import { FindInvoiceModalBody } from "@/components/reconcile/FindInvoiceModalBody"
import type { CandidateResult } from "@/api-types/reconcile"
import type { TransactionRow } from "@/components/reconcile/types"

export function FindInvoiceModal({
  transaction,
  range,
  linking,
  onLink,
  onClose,
}: {
  transaction: TransactionRow | null
  range: { from: string; to: string }
  linking: boolean
  onLink: (candidate: CandidateResult) => void
  onClose: () => void
}) {
  return (
    <Dialog open={!!transaction} onOpenChange={(open) => { if (!open) onClose() }}>
      {transaction && (
        <FindInvoiceModalBody
          key={transaction.id}
          transaction={transaction}
          range={range}
          linking={linking}
          onLink={onLink}
        />
      )}
    </Dialog>
  )
}
