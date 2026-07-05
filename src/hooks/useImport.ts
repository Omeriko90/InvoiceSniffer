import { useMutation, useQuery } from "@tanstack/react-query"
import { queries } from "@/queries"
import { importTransactions } from "@/api/import"

export function useCsvMappings() {
  return useQuery(queries.import.mappings)
}

export function useImportTransactions() {
  return useMutation({ mutationFn: importTransactions })
}
