import type { AnomalySeverity } from "@prisma/client"

// Shape of the `details` JSON stored on an AnomalyLog. All fields optional —
// each anomaly type populates the subset it needs (see alert-helpers.ts).
export interface AnomalyDetails {
  actual?: number        // the observed amount that triggered the alert
  expected?: number      // baseline: median / trailing average / expected amount
  pct?: number           // percent above/below baseline (e.g. 312)
  multiple?: number      // spike factor (e.g. 2 → "2×")
  rangeLow?: number       // normal range floor
  rangeHigh?: number      // normal range ceiling
  overdueDays?: number   // days a recurring invoice is overdue
  expectedDate?: string  // ISO date a recurring invoice was expected
  firstSeenDate?: string // ISO date a new vendor first appeared
  currency?: string      // ISO currency for the amounts above (default USD)
  note?: string          // optional trailing sentence
}

export interface AlertItem {
  id: string
  type: string
  severity: AnomalySeverity
  details: AnomalyDetails
  vendorName: string | null
  invoice: { vendorName: string | null } | null
}
