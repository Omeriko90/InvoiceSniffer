import { fetchAlerts } from "@/api/alerts"
import type { AlertFilter } from "@/api-types/alerts"
import { createQueryKeys } from "@lukemorales/query-key-factory"

export const alertsKeys = createQueryKeys("alerts", {
  list: (severity: AlertFilter) => ({
    queryKey: [severity],
    queryFn: () => fetchAlerts(severity),
  }),
})
