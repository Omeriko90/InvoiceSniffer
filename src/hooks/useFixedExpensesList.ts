import { useQuery } from "@tanstack/react-query"
import { queries } from "@/queries"
import { fetchFixedExpenses } from "@/api/fixed-expenses"

// The org's fixed expenses, for the invoice-drawer "link to an existing expense"
// dropdown. Fetched only when the dialog opens (`enabled`).
export function useFixedExpensesList(enabled: boolean) {
  return useQuery({
    queryKey: queries.fixedExpenses.list.queryKey,
    queryFn: fetchFixedExpenses,
    enabled,
  })
}
