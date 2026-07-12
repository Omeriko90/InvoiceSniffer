import { format } from "date-fns"
import type { AnomalySeverity } from "@prisma/client"
import { fmtMoney } from "@/lib/money"
import type { AnomalyDetails } from "@/types/alert"

// Type pill — the human name + tint shown next to the vendor on each card.
export const ALERT_META: Record<string, { label: string; color: string; bg: string }> = {
  AMOUNT_HIGH:       { label: "Unusually high",   color: "#DC2626", bg: "#FEF2F2" },
  AMOUNT_LOW:        { label: "Unusually low",    color: "#B45309", bg: "#FFFBEB" },
  SPEND_SPIKE:       { label: "Monthly spike",    color: "#B45309", bg: "#FFFBEB" },
  MISSING_RECURRING: { label: "Missing recurring", color: "#B45309", bg: "#FFFBEB" },
  NEW_VENDOR:        { label: "New vendor",       color: "#2563EB", bg: "#EFF6FF" },
}

// Severity drives the card accent border, icon tile, and the filter chips.
export const SEVERITY_META: Record<AnomalySeverity, {
  label: string      // filter-chip / drawer label
  accent: string     // left border + metric value color
  iconBg: string
  iconStroke: string
  chipBg: string
  chipBorder: string
  chipColor: string
}> = {
  HIGH:   { label: "Critical", accent: "#FB7171", iconBg: "#FEF2F2", iconStroke: "#FB7171", chipBg: "#FEF2F2", chipBorder: "#FECACA", chipColor: "#DC2626" },
  MEDIUM: { label: "Warning",  accent: "#FBBF24", iconBg: "#FFFBEB", iconStroke: "#FBBF24", chipBg: "#FFFBEB", chipBorder: "#FDE68A", chipColor: "#B45309" },
  LOW:    { label: "Info",     accent: "#60A5FA", iconBg: "#EFF6FF", iconStroke: "#60A5FA", chipBg: "#EFF6FF", chipBorder: "#BFDBFF", chipColor: "#2563EB" },
}

// Maps a URL filter value to the severity it selects (or "all" → no filter).
export const FILTER_SEVERITY: Record<string, AnomalySeverity | null> = {
  all:      null,
  critical: "HIGH",
  warning:  "MEDIUM",
  info:     "LOW",
}

function money(amount: number | undefined, currency = "USD"): string {
  return amount === undefined ? "—" : fmtMoney(amount, currency)
}

function day(iso: string | undefined): string {
  return iso ? format(new Date(iso), "MMM d") : ""
}

// Right-aligned metric block on each card: a small uppercase label + big value.
export function alertMetric(type: string, details: AnomalyDetails): { label: string; value: string } {
  switch (type) {
    case "AMOUNT_HIGH":       return { label: "vs median",  value: details.pct !== undefined ? `+${details.pct}%` : "High" }
    case "AMOUNT_LOW":        return { label: "vs median",  value: details.pct !== undefined ? `-${details.pct}%` : "Low" }
    case "SPEND_SPIKE":       return { label: "this month", value: details.multiple !== undefined ? `${details.multiple}×` : "Spike" }
    case "MISSING_RECURRING": return { label: "overdue",    value: details.overdueDays !== undefined ? `${details.overdueDays}d` : "Due" }
    case "NEW_VENDOR":        return { label: "first seen",  value: "New" }
    default:                  return { label: "alert",      value: "—" }
  }
}

// One-line (card) / full (drawer) explanation, built from the details JSON.
export function alertDescription(type: string, details: AnomalyDetails): string {
  const c = details.currency
  switch (type) {
    case "AMOUNT_HIGH": {
      const range = details.rangeLow !== undefined && details.rangeHigh !== undefined
        ? ` Normal range is ${money(details.rangeLow, c)}–${money(details.rangeHigh, c)}.`
        : ""
      return `This invoice is ${money(details.actual, c)} — ${details.pct ?? "well"}% above the median of ${money(details.expected, c)}.${range}`
    }
    case "AMOUNT_LOW":
      return `${money(details.actual, c)} received — lower than the usual ${money(details.expected, c)}.`
    case "SPEND_SPIKE":
      return `This month's vendor spend reached ${money(details.actual, c)} versus a trailing average of ${money(details.expected, c)}.${details.note ? ` ${details.note}` : ""}`
    case "MISSING_RECURRING": {
      const when = details.expectedDate ? ` around ${day(details.expectedDate)}` : ""
      return `A recurring invoice (~${money(details.expected, c)}) was expected${when} based on prior cadence, but none has been detected within the grace period.`
    }
    case "NEW_VENDOR": {
      const when = details.firstSeenDate ? ` on ${day(details.firstSeenDate)}` : ""
      return `First invoice ever from this vendor: ${money(details.actual, c)}${when}. We started a spend baseline for future comparisons.`
    }
    default:
      return "Review this alert."
  }
}
