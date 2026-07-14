import { useMutation, useQuery } from "@tanstack/react-query"
import { queries } from "@/queries"
import { saveCsvMapping } from "@/api/import"

export function useCsvMappings() {
  return useQuery(queries.import.mappings)
}

export function useSaveMapping() {
  return useMutation({ mutationFn: saveCsvMapping })
}
