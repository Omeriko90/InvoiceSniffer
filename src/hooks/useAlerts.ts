import { useQuery } from "@tanstack/react-query"
import { queries } from "@/queries"
import type { AlertFilter } from "@/api-types/alerts"

export function useAlerts(severity: AlertFilter) {
  return useQuery(queries.alerts.list(severity))
}
