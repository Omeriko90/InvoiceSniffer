import { fetchDashboard } from "@/api/dashboard"
import { createQueryKeys } from "@lukemorales/query-key-factory"

export const dashboardKeys = createQueryKeys("dashboard", {
  summary: {
    queryKey: null,
    queryFn: () => fetchDashboard(),
  },
})
