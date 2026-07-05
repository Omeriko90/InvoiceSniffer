import { useQuery } from "@tanstack/react-query"
import { queries } from "@/queries"

export function useSettings() {
  return useQuery(queries.settings.all)
}
