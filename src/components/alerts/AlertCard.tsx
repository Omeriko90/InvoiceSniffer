// Client component by import — only ever rendered from the Alerts page.
import { AlertTriangle } from "lucide-react"
import { StatusPill } from "@/components/ui/status-pill"
import type { AlertItem } from "@/types/alert"
import {
  ALERT_META,
  SEVERITY_META,
  alertDescription,
  alertMetric,
} from "@/lib/alert-helpers"
import { ALERT_ICON } from "@/components/alerts/constants"
import { CardButton } from "@/components/alerts/CardButton"

export function AlertCard({
  alert,
  onView,
  onDismiss,
  dismissing,
}: {
  alert: AlertItem
  onView: () => void
  onDismiss: () => void
  dismissing: boolean
}) {
  const sev    = SEVERITY_META[alert.severity]
  const meta   = ALERT_META[alert.type] ?? { label: alert.type, color: "#64748B", bg: "#F1F3F8" }
  const vendor = alert.invoice?.vendorName ?? alert.vendorName ?? "Unknown vendor"
  const metric = alertMetric(alert.type, alert.details)
  const Icon   = ALERT_ICON[alert.type] ?? AlertTriangle

  return (
    <div
      className="bg-white border border-border rounded-lg p-4 flex gap-4 items-center"
      style={{ borderLeft: `4px solid ${sev.accent}` }}
    >
      <div
        className="w-10 h-10 rounded-[11px] grid place-items-center shrink-0"
        style={{ background: sev.iconBg }}
      >
        <Icon size={19} strokeWidth={2} style={{ color: sev.iconStroke }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-0.75 flex-wrap">
          <span className="text-base font-bold text-heading">{vendor}</span>
          <StatusPill bg={meta.bg} color={meta.color} className="text-xs px-2.25">
            {meta.label}
          </StatusPill>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          {alertDescription(alert.type, alert.details)}
        </p>
      </div>

      <div className="text-end shrink-0">
        <div className="text-xs font-semibold uppercase tracking-[0.04em] text-dim">
          {metric.label}
        </div>
        <div className="text-xl font-extrabold tracking-[-0.02em]" style={{ color: sev.accent }}>
          {metric.value}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 shrink-0">
        <CardButton onClick={onView}>View</CardButton>
        <CardButton onClick={onDismiss} disabled={dismissing} muted>
          Dismiss
        </CardButton>
      </div>
    </div>
  )
}
