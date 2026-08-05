// Client component by import — only ever rendered from <RecentAlertsCard>.
import { StatusPill } from "@/components/ui/status-pill"
import { ALERT_META, alertDescription } from "@/lib/alert-helpers"
import type { AlertItem } from "@/types/alert"

export function AlertListItem({ alert }: { alert: AlertItem }) {
  const meta   = ALERT_META[alert.type] ?? { label: alert.type, color: "#94A3B8", bg: "#F1F3F8" }
  const vendor = alert.invoice?.vendorName ?? alert.vendorName
  return (
    <div className="flex gap-2.75 py-2.75 border-b border-hover last:border-0">
      <span className="w-2.25 h-2.25 rounded-full mt-1.25 shrink-0" style={{ background: meta.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap leading-none mb-0.75">
          <span className="text-sm font-semibold text-heading">{vendor}</span>
          <StatusPill bg={meta.bg} color={meta.color} size="xs" className="shrink-0">
            {meta.label}
          </StatusPill>
        </div>
        <p className="text-xs text-text-secondary line-clamp-1 leading-relaxed">
          {alertDescription(alert.type, alert.details)}
        </p>
      </div>
    </div>
  )
}
