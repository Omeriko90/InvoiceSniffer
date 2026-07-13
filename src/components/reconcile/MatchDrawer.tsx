// Client component by import — only ever rendered from ReconcileClient
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { MatchDrawerBody } from "@/components/reconcile/MatchDrawerBody"
import type { RunAction, TransactionRow } from "@/components/reconcile/types"

export function MatchDrawer({
  transaction,
  onClose,
  onRun,
  onFind,
  pending,
}: {
  transaction: TransactionRow | null
  onClose: () => void
  onRun: (id: string, action: RunAction) => void
  onFind: (txn: TransactionRow) => void
  pending: boolean
}) {
  return (
    <Sheet
      open={!!transaction}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {transaction && (
        <SheetContent
          side="right"
          className="data-[side=right]:w-full data-[side=right]:sm:max-w-[500px] bg-card border-border p-0 gap-0"
        >
          <MatchDrawerBody transaction={transaction} onRun={onRun} onFind={onFind} pending={pending} />
        </SheetContent>
      )}
    </Sheet>
  )
}
