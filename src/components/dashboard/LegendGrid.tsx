// Client component by import — only ever rendered from <ReconciliationCard>.
import type { RecStats } from "@/components/dashboard/types"
import { LEGEND } from "@/components/dashboard/constants"

export function LegendGrid({ rec }: { rec: RecStats }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {LEGEND.map((item) => (
        <div key={item.label}>
          <div className="flex items-center gap-1.5 mb-[3px]">
            <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-[12.5px] text-text-secondary">{item.label}</span>
          </div>
          <span className="text-[20px] font-[700] text-heading leading-none pl-[17px]">{rec[item.key]}</span>
        </div>
      ))}
    </div>
  )
}
