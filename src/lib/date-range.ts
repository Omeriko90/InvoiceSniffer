import { endOfDay, startOfDay, startOfMonth, startOfYear, subDays, subMonths, subYears } from "date-fns"
import type { DateRange } from "@/lib/matching-data"

// Reconcile date-range scope. Presets are trailing windows ending today; the
// user matches against invoices whose effective date falls inside the window.
export const DATE_RANGE_PRESETS = ["week", "month", "mtd", "3m", "6m", "year", "ytd"] as const
export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number]

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  week: "Last 7 days",
  month: "Last month",
  mtd: "Current month",
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  year: "Last 12 months",
  ytd: "Year to date",
}

// Thrown when a client-supplied custom {from,to} is unparseable, inverted, or
// spans an unreasonable window. Callers catch this and return a 400 rather than
// letting an `Invalid Date` reach Prisma (500) or a huge range drive a full scan.
export class InvalidDateRangeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidDateRangeError"
  }
}

// Widest custom range we'll query. Generous (covers multi-year exports) but
// bounded so a crafted `from=1900&to=3000` can't force an unbounded table scan.
export const MAX_CUSTOM_RANGE_DAYS = 366 * 3
const MS_PER_DAY = 24 * 60 * 60 * 1000

// Resolve a preset (or a custom {from,to}) into a concrete range. `now` is
// injected so this is deterministic and testable.
export function resolveDateRange(
  scope: { preset: DateRangePreset } | { from: string | Date; to: string | Date },
  now: Date
): DateRange {
  if ("from" in scope) {
    const from = startOfDay(new Date(scope.from))
    const to = endOfDay(new Date(scope.to))
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new InvalidDateRangeError("from and to must be valid dates")
    }
    if (from.getTime() > to.getTime()) {
      throw new InvalidDateRangeError("from must be on or before to")
    }
    if (to.getTime() - from.getTime() > MAX_CUSTOM_RANGE_DAYS * MS_PER_DAY) {
      throw new InvalidDateRangeError(`date range too large (max ${MAX_CUSTOM_RANGE_DAYS} days)`)
    }
    return { from, to }
  }
  const to = endOfDay(now)
  switch (scope.preset) {
    case "week":
      return { from: startOfDay(subDays(now, 7)), to }
    case "month":
      return { from: startOfDay(subMonths(now, 1)), to }
    case "mtd":
      return { from: startOfMonth(now), to }
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
