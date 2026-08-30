// Dashboard overview date-range presets — a curated subset of the reconcile
// presets (src/lib/date-range.ts), relabeled for a financial overview. Every
// value is a valid DateRangePreset, so resolveDateRange() handles them directly.
// Client-safe: no server imports.
import type { DateRangePreset } from "@/lib/date-range"

export const DASHBOARD_PRESETS = ["mtd", "3m", "6m", "year", "ytd"] as const
export type DashboardPreset = (typeof DASHBOARD_PRESETS)[number]

// Compile-time guard that every dashboard preset is a real DateRangePreset.
const _presetCheck: readonly DateRangePreset[] = DASHBOARD_PRESETS
void _presetCheck

export const DASHBOARD_PRESET_LABELS: Record<DashboardPreset, string> = {
  mtd: "Current month",
  "3m": "Quarter",
  "6m": "Half year",
  year: "Year",
  ytd: "YTD",
}

// A preset window, or an explicit custom range (ISO yyyy-mm-dd date strings).
export type DashboardScope = { preset: DashboardPreset } | { from: string; to: string }

export function isDashboardPreset(scope: DashboardScope): scope is { preset: DashboardPreset } {
  return "preset" in scope
}
