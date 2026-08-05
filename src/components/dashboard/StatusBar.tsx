// Client component by import — only ever rendered from <ReconciliationCard>.
import type { RecStats } from "@/components/dashboard/types"

export function StatusBar({ rec }: { rec: RecStats }) {
  const pct = (n: number) => `${Math.round((n / rec.total) * 100)}%`

  return (
    <div className="h-3.5 rounded-full overflow-hidden flex">
      {rec.matched   > 0 && <div className="flex-none bg-success" style={{ width: pct(rec.matched) }} />}
      {rec.possible  > 0 && <div className="flex-none bg-warning" style={{ width: pct(rec.possible) }} />}
      {rec.missing   > 0 && <div className="flex-none bg-danger" style={{ width: pct(rec.missing) }} />}
      {rec.noInvoice > 0 && <div className="flex-none bg-faint" style={{ width: pct(rec.noInvoice) }} />}
      {rec.total === 1   && <div className="flex-1 bg-border" />}
    </div>
  )
}
