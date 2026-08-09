// Client component by import — only ever rendered from <AlertDetailDrawer>.
import { AlertTriangle } from "lucide-react"
import { SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/components/buttons"
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
    <div className="flex items-center gap-[11px]">
      <div
        className="w-[38px] h-[38px] rounded-[10px] grid place-items-center shrink-0"
        style={{ background: sev.iconBg }}
      >
        <Icon size={19} strokeWidth={2} style={{ color: sev.iconStroke }} />
      </div>
      <div className="min-w-0">
        <SheetTitle className="text-[16px] font-[700] text-heading truncate">{vendor}</SheetTitle>
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
        className="rounded-[12px] px-[16px] py-[14px] flex items-center justify-between"
        style={{ background: sev.iconBg }}
      >
        <span className="text-[12px] font-[600] uppercase tracking-[0.04em]" style={{ color: sev.iconStroke }}>
          {metric.label}
        </span>
        <span className="text-[24px] font-[800] tracking-[-0.02em]" style={{ color: sev.accent }}>
          {metric.value}
        </span>
      </div>

      <p className="text-[13.5px] text-text-primary leading-[1.6]">
        {alertDescription(alert.type, alert.details)}
      </p>

      {fields.length > 0 && (
        <div className="border border-[#E8EDFA] rounded-[13px] overflow-hidden">
          <div className="px-[15px] py-[10px] bg-[#F8FAFF] border-b border-[#E8EDFA] text-[11px] font-[700] uppercase tracking-[0.04em] text-[#94A3B8]">
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
      variant="secondary"
      onClick={() => onDismiss(alert.id)}
      disabled={dismissing}
      className="h-auto w-full text-[13px] font-[700] px-[14px] py-[10px] rounded-[10px] border border-[#E8EDFA] bg-white text-[#475569] cursor-pointer transition-colors hover:bg-[#F1F3F8] hover:text-[#475569] disabled:opacity-50 disabled:cursor-default"
    >
      Dismiss alert
    </Button>
  )
}

export const Body = { Header, Content, Footer }
