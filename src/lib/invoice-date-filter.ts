import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
} from "date-fns"

// Date scoping for the Invoices list. Unlike the Reconcile presets in
// `date-range.ts` (which are all trailing windows), these include calendar-month
// semantics ("Current month", "Last month") and an explicit "All time" escape
// hatch. Kept separate so the two lists can evolve independently.
export const INVOICE_DATE_PRESETS = [
  "all",
  "thisMonth",
  "lastMonth",
  "3m",
  "6m",
  "ytd",
  "year",
] as const
export type InvoiceDatePreset = (typeof INVOICE_DATE_PRESETS)[number]

export const INVOICE_DATE_PRESET_LABELS: Record<InvoiceDatePreset, string> = {
  all: "All time",
  thisMonth: "Current month",
  lastMonth: "Last month",
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  ytd: "Year to date",
  year: "Last 12 months",
}

export type InvoiceDateScope =
  | { preset: InvoiceDatePreset }
  | { from: string; to: string }

export function isPreset(scope: InvoiceDateScope): scope is { preset: InvoiceDatePreset } {
  return "preset" in scope
}

// Resolve a scope into concrete bounds, or `null` for "no filter". `now` is
// injected so this stays deterministic and testable.
export function resolveInvoiceDateRange(
  scope: InvoiceDateScope,
  now: Date
): { from: Date; to: Date } | null {
  if (!isPreset(scope)) {
    return { from: startOfDay(new Date(scope.from)), to: endOfDay(new Date(scope.to)) }
  }
  const to = endOfDay(now)
  switch (scope.preset) {
    case "all":
      return null
    case "thisMonth":
      return { from: startOfMonth(now), to }
    case "lastMonth": {
      const prev = subMonths(now, 1)
      return { from: startOfMonth(prev), to: endOfMonth(prev) }
    }
    case "3m":
      return { from: startOfDay(subMonths(now, 3)), to }
    case "6m":
      return { from: startOfDay(subMonths(now, 6)), to }
    case "ytd":
      return { from: startOfYear(now), to }
    case "year":
      return { from: startOfDay(subYears(now, 1)), to }
  }
}
