// Client component by import — only ever rendered from <AlertDetailDrawer>.
import { AlertTriangle } from "lucide-react"
import { SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  ALERT_META,
  SEVERITY_META,
  alertDescription,
  alertMetric,
} from "@/lib/alert-helpers"
import type { AlertItem } from "@/types/alert"
import { ALERT_ICON } from "@/components/alerts/constants"
import { detailFields } from "@/components/alerts/helpers"
import { Field } from "@/components/alerts/Field"

function metaFor(alert: AlertItem) {
  const sev  = SEVERITY_META[alert.severity]
  const meta = ALERT_META[alert.type] ?? { label: alert.type, color: "#64748B", bg: "#F1F3F8" }
  return { sev, meta }
}

function Header({ alert }: { alert: AlertItem }) {
  const { sev, meta } = metaFor(alert)
  const vendor = alert.invoice?.vendorName ?? alert.vendorName ?? "Unknown vendor"
  const Icon = ALERT_ICON[alert.type] ?? AlertTriangle

  return (
    <div className="flex items-center gap-2.75">
      <div
        className="w-9.5 h-9.5 rounded-lg grid place-items-center shrink-0"
        style={{ background: sev.iconBg }}
      >
        <Icon size={19} strokeWidth={2} style={{ color: sev.iconStroke }} />
      </div>
      <div className="min-w-0">
        <SheetTitle className="text-lg font-bold text-heading truncate">{vendor}</SheetTitle>
        <SheetDescription className="text-[12.5px]" style={{ color: meta.color }}>
          {meta.label} · {sev.label}
        </SheetDescription>
      </div>
    </div>
  )
}

function Content({ alert }: { alert: AlertItem }) {
  const { sev } = metaFor(alert)
  const metric = alertMetric(alert.type, alert.details)
  const fields = detailFields(alert)

  return (
    <>
      {/* Metric banner */}
      <div
        className="rounded-lg px-4 py-3.5 flex items-center justify-between"
        style={{ background: sev.iconBg }}
      >
        <span className="text-sm font-semibold tracking-tight" style={{ color: sev.iconStroke }}>
          {metric.label}
        </span>
        <span className="text-4xl font-bold tracking-tight" style={{ color: sev.accent }}>
          {metric.value}
        </span>
      </div>

      <p className="text-[13.5px] text-text-primary leading-[1.6]">
        {alertDescription(alert.type, alert.details)}
      </p>

      {fields.length > 0 && (
        <div className="border border-[#E8EDFA] rounded-[13px] overflow-hidden">
          <div className="px-3.5 py-2.5 bg-surface border-b border-border text-sm font-bold tracking-tight text-text-secondary">
            Details
          </div>
          {fields.map((f) => (
            <Field key={f.label} label={f.label} value={f.value} />
          ))}
        </div>
      )}
    </>
  )
}

function Footer({
  alert,
  onDismiss,
  dismissing,
}: {
  alert: AlertItem
  onDismiss: (id: string) => void
  dismissing: boolean
}) {
  return (
    <Button
      variant="outline"
      onClick={() => onDismiss(alert.id)}
      disabled={dismissing}
      className="h-auto w-full text-sm font-bold px-3.5 py-2.5 rounded-lg border border-border bg-white text-text-primary cursor-pointer transition-colors hover:bg-hover hover:text-text-primary disabled:opacity-50 disabled:cursor-default"
    >
      Dismiss alert
    </Button>
  )
}

export const Body = { Header, Content, Footer }
