// Client component by import — only ever rendered from ReconcileClient
import { Dialog } from "@/components/ui/dialog"
import { FindInvoiceModalBody } from "@/components/reconcile/FindInvoiceModalBody"
import type { TransactionRow } from "@/components/reconcile/types"

export function FindInvoiceModal({ transaction, onClose }: {
  transaction: TransactionRow | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!transaction} onOpenChange={(open) => { if (!open) onClose() }}>
      {transaction && (
        <FindInvoiceModalBody key={transaction.id} transaction={transaction} onClose={onClose} />
      )}
    </Dialog>
  )
}
