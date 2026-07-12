// Client component by import — only ever rendered from the Alerts page.
import { format } from "date-fns"
import {
  AlertTriangle,
  Clock,
  Plus,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { fmtMoney } from "@/lib/money"
import {
  ALERT_META,
  SEVERITY_META,
  alertDescription,
  alertMetric,
} from "@/lib/alert-helpers"
import type { AlertItem } from "@/types/alert"

const ALERT_ICON: Record<string, LucideIcon> = {
  AMOUNT_HIGH:       AlertTriangle,
  AMOUNT_LOW:        TrendingDown,
  SPEND_SPIKE:       TrendingUp,
  MISSING_RECURRING: Clock,
  NEW_VENDOR:        Plus,
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-[15px] py-[12px] border-b border-[#F1F3F8] last:border-0">
      <span className="text-[12.5px] text-text-secondary">{label}</span>
      <span className="text-[13px] font-[600] text-heading">{value}</span>
    </div>
  )
}

// Turn the details JSON into a labelled key/value list for the drawer body.
function detailFields(alert: AlertItem): { label: string; value: string }[] {
  const d = alert.details
  const c = d.currency
  const fields: { label: string; value: string }[] = []
  const money = (n?: number) => (n === undefined ? null : fmtMoney(n, c ?? "USD"))

  const push = (label: string, value: string | null | undefined) => {
    if (value !== null && value !== undefined) fields.push({ label, value })
  }

  push("Observed amount", money(d.actual))
  push("Baseline", money(d.expected))
  if (d.rangeLow !== undefined && d.rangeHigh !== undefined) {
    push("Normal range", `${money(d.rangeLow)} – ${money(d.rangeHigh)}`)
  }
  if (d.pct !== undefined) push("Deviation", `${d.pct}%`)
  if (d.multiple !== undefined) push("Spike factor", `${d.multiple}×`)
  if (d.overdueDays !== undefined) push("Overdue", `${d.overdueDays} days`)
  if (d.expectedDate) push("Expected", format(new Date(d.expectedDate), "MMM d, yyyy"))
  if (d.firstSeenDate) push("First seen", format(new Date(d.firstSeenDate), "MMM d, yyyy"))

  return fields
}

export function AlertDetailDrawer({
  alert,
  onClose,
  onDismiss,
  dismissing,
}: {
  alert: AlertItem | null
  onClose: () => void
  onDismiss: (id: string) => void
  dismissing: boolean
}) {
  return (
    <Sheet open={!!alert} onOpenChange={(open) => !open && onClose()}>
      {alert && (
        <SheetContent
          side="right"
          className="data-[side=right]:w-full data-[side=right]:sm:max-w-[440px] bg-white border-[#E8EDFA] p-0 gap-0 flex flex-col"
        >
          <Body alert={alert} onDismiss={onDismiss} dismissing={dismissing} />
        </SheetContent>
      )}
    </Sheet>
  )
}

function Body({
  alert,
  onDismiss,
  dismissing,
}: {
  alert: AlertItem
  onDismiss: (id: string) => void
  dismissing: boolean
}) {
  const sev    = SEVERITY_META[alert.severity]
  const meta   = ALERT_META[alert.type] ?? { label: alert.type, color: "#64748B", bg: "#F1F3F8" }
  const vendor = alert.invoice?.vendorName ?? alert.vendorName ?? "Unknown vendor"
  const metric = alertMetric(alert.type, alert.details)
  const Icon   = ALERT_ICON[alert.type] ?? AlertTriangle
  const fields = detailFields(alert)

  return (
    <>
      <SheetHeader className="px-[22px] pt-[20px] pb-[16px] border-b border-[#F1F3F8]">
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
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-[22px] py-[18px] flex flex-col gap-[16px]">
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
      </div>

      <div className="px-[22px] py-[16px] border-t border-[#F1F3F8]">
        <button
          onClick={() => onDismiss(alert.id)}
          disabled={dismissing}
          className="w-full text-[13px] font-[700] px-[14px] py-[10px] rounded-[10px] border border-[#E8EDFA] bg-white text-[#475569] cursor-pointer transition-colors hover:bg-[#F1F3F8] disabled:opacity-50 disabled:cursor-default"
        >
          Dismiss alert
        </button>
      </div>
    </>
  )
}
