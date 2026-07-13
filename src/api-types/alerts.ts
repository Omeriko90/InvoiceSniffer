import type { AlertItem } from "@/types/alert"

// Filter values accepted by GET /api/alerts (?severity=).
export type AlertFilter = "all" | "critical" | "warning" | "info"

export const ALERT_FILTERS: AlertFilter[] = ["all", "critical", "warning", "info"]

export interface AlertsResponse {
  alerts: AlertItem[]
  // Per-severity counts over ALL unacknowledged alerts (filter-independent),
  // so the chip badges stay stable regardless of the active filter.
  counts: Record<AlertFilter, number>
}
