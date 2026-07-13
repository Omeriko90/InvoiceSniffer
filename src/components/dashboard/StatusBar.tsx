// Client component by import — only ever rendered from <ReconciliationCard>.
import type { RecStats } from "@/components/dashboard/types"

export function StatusBar({ rec }: { rec: RecStats }) {
  const pct = (n: number) => `${Math.round((n / rec.total) * 100)}%`

  return (
    <div className="h-[14px] rounded-full overflow-hidden flex">
      {rec.matched   > 0 && <div style={{ width: pct(rec.matched),   background: "#34D399", flex: "none" }} />}
      {rec.possible  > 0 && <div style={{ width: pct(rec.possible),  background: "#FBBF24", flex: "none" }} />}
      {rec.missing   > 0 && <div style={{ width: pct(rec.missing),   background: "#FB7171", flex: "none" }} />}
      {rec.noInvoice > 0 && <div style={{ width: pct(rec.noInvoice), background: "#CBD5E1", flex: "none" }} />}
      {rec.total === 1   && <div className="flex-1" style={{ background: "#E8EDFA" }} />}
    </div>
  )
}
