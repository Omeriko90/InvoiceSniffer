import { format } from "date-fns"
import { fmtMoney } from "@/lib/money"
import type { AlertItem } from "@/types/alert"

// Turn the details JSON into a labelled key/value list for the drawer body.
export function detailFields(alert: AlertItem): { label: string; value: string }[] {
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
