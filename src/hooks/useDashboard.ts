import { useQuery } from "@tanstack/react-query"
import { queries } from "@/queries"

export function useDashboard() {
  return useQuery(queries.dashboard.summary)
}
