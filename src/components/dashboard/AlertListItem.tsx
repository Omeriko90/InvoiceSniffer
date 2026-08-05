// Client component by import — only ever rendered from <RecentAlertsCard>.
import { StatusPill } from "@/components/ui/status-pill"
import { ALERT_META, alertDescription } from "@/lib/alert-helpers"
import type { AlertItem } from "@/types/alert"

export function AlertListItem({ alert }: { alert: AlertItem }) {
  const meta   = ALERT_META[alert.type] ?? { label: alert.type, color: "#94A3B8", bg: "#F1F3F8" }
  const vendor = alert.invoice?.vendorName ?? alert.vendorName
  return (
    <div className="flex gap-[11px] py-[11px] border-b border-hover last:border-0">
      <span className="w-[9px] h-[9px] rounded-full mt-[5px] shrink-0" style={{ background: meta.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap leading-none mb-[3px]">
          <span className="text-[13.5px] font-[600] text-heading">{vendor}</span>
          <StatusPill bg={meta.bg} color={meta.color} size="xs" className="shrink-0">
            {meta.label}
          </StatusPill>
        </div>
        <p className="text-[12.5px] text-text-secondary line-clamp-1 leading-[1.5]">
          {alertDescription(alert.type, alert.details)}
        </p>
      </div>
    </div>
  )
}
