import { fetchDashboard } from "@/api/dashboard"
import { createQueryKeys } from "@lukemorales/query-key-factory"

export const dashboardKeys = createQueryKeys("dashboard", {
  // Keyed by the resolved range so switching presets/custom refetches.
  summary: (range: { from: string; to: string }) => ({
    queryKey: [range],
    queryFn: () => fetchDashboard(range),
  }),
})
