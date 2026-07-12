// Client component by import — only ever rendered from the Alerts page.
import {
  AlertTriangle,
  Clock,
  Plus,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import type { AlertItem } from "@/types/alert"
import {
  ALERT_META,
  SEVERITY_META,
  alertDescription,
  alertMetric,
} from "@/lib/alert-helpers"

const ALERT_ICON: Record<string, LucideIcon> = {
  AMOUNT_HIGH:       AlertTriangle,
  AMOUNT_LOW:        TrendingDown,
  SPEND_SPIKE:       TrendingUp,
  MISSING_RECURRING: Clock,
  NEW_VENDOR:        Plus,
}

// Small pill-shaped button matching the mock's View/Dismiss affordances.
function CardButton({
  onClick,
  disabled,
  muted,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-[12.5px] font-[600] px-[13px] py-[7px] rounded-[9px] border border-[#E8EDFA] bg-white whitespace-nowrap cursor-pointer transition-colors hover:bg-[#F1F3F8] disabled:opacity-50 disabled:cursor-default"
      style={{ color: muted ? "#94A3B8" : "#475569" }}
    >
      {children}
    </button>
  )
}

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
      className="bg-white border border-border rounded-[12px] p-[16px_18px] flex gap-[16px] items-center"
      style={{ borderLeft: `4px solid ${sev.accent}` }}
    >
      <div
        className="w-[40px] h-[40px] rounded-[11px] grid place-items-center shrink-0"
        style={{ background: sev.iconBg }}
      >
        <Icon size={19} strokeWidth={2} style={{ color: sev.iconStroke }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[10px] mb-[3px] flex-wrap">
          <span className="text-[14.5px] font-[700] text-heading">{vendor}</span>
          <span
            className="text-[11px] font-[700] px-[9px] py-[2px] rounded-full"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>
        <p className="text-[13px] text-text-secondary leading-[1.5]">
          {alertDescription(alert.type, alert.details)}
        </p>
      </div>

      <div className="text-right shrink-0">
        <div className="text-[11px] font-[600] uppercase tracking-[0.04em] text-[#94A3B8]">
          {metric.label}
        </div>
        <div className="text-[20px] font-[800] tracking-[-0.02em]" style={{ color: sev.accent }}>
          {metric.value}
        </div>
      </div>

      <div className="flex flex-col gap-[6px] shrink-0">
        <CardButton onClick={onView}>View</CardButton>
        <CardButton onClick={onDismiss} disabled={dismissing} muted>
          Dismiss
        </CardButton>
      </div>
    </div>
  )
}
