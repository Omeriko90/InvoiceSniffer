import { useQuery } from "@tanstack/react-query"
import { queries } from "@/queries"

// `range` is the resolved {from,to} (ISO). Null while a custom range is
// incomplete — the query stays disabled until both ends are set.
export function useDashboard(range: { from: string; to: string } | null) {
  return useQuery({
    ...queries.dashboard.summary(range ?? { from: "", to: "" }),
    enabled: range !== null,
  })
}
