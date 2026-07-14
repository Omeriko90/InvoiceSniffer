import { endOfDay, startOfDay, startOfYear, subDays, subMonths, subYears } from "date-fns"
import type { DateRange } from "@/lib/matching-data"

// Reconcile date-range scope. Presets are trailing windows ending today; the
// user matches against invoices whose effective date falls inside the window.
export const DATE_RANGE_PRESETS = ["week", "month", "3m", "6m", "year", "ytd"] as const
export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number]

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  week: "Last 7 days",
  month: "Last month",
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  year: "Last 12 months",
  ytd: "Year to date",
}

// Resolve a preset (or a custom {from,to}) into a concrete range. `now` is
// injected so this is deterministic and testable.
export function resolveDateRange(
  scope: { preset: DateRangePreset } | { from: string | Date; to: string | Date },
  now: Date
): DateRange {
  if ("from" in scope) {
    return { from: startOfDay(new Date(scope.from)), to: endOfDay(new Date(scope.to)) }
  }
  const to = endOfDay(now)
  switch (scope.preset) {
    case "week":
      return { from: startOfDay(subDays(now, 7)), to }
    case "month":
      return { from: startOfDay(subMonths(now, 1)), to }
    case "3m":
      return { from: startOfDay(subMonths(now, 3)), to }
    case "6m":
      return { from: startOfDay(subMonths(now, 6)), to }
    case "year":
      return { from: startOfDay(subYears(now, 1)), to }
    case "ytd":
      return { from: startOfYear(now), to }
  }
}
