// Client component by import — only ever rendered from ReconcileClient
import { DetailDrawer } from "@/components/ui/detail-drawer"
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
    <DetailDrawer
      open={!!transaction}
      onClose={onClose}
      className="w-[500px] sm:max-w-[500px] bg-card"
      headerClassName="pt-[20px] pb-[16px]"
      contentClassName="py-[18px] flex flex-col gap-[16px]"
      footerClassName="py-[16px] flex gap-[8px]"
      header={transaction ? <MatchDrawerBody.Header transaction={transaction} /> : null}
      footer={
        transaction ? (
          <MatchDrawerBody.Footer transaction={transaction} onRun={onRun} onFind={onFind} pending={pending} />
        ) : undefined
      }
    >
      {transaction && <MatchDrawerBody.Content transaction={transaction} />}
    </DetailDrawer>
  )
}
