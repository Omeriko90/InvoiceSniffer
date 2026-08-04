import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queries } from "@/queries"
import {
  fetchFixedExpenseCandidates,
  fetchFixedExpenseTimeline,
  linkInvoiceToFixedExpense,
} from "@/api/fixed-expenses"

const PAGE = 12

// Paged coverage timeline for the detail drawer. Each page is a block of periods
// (newest first); `offset` counts periods back from the current one.
export function useFixedExpenseTimeline(id: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: queries.fixedExpenses.timeline(id).queryKey,
    queryFn: ({ pageParam }) => fetchFixedExpenseTimeline({ id, offset: pageParam, limit: PAGE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length * PAGE : undefined),
    enabled,
  })
}

// Unlinked invoices that plausibly belong to this expense, for the manual-link
// picker. Fetched only when the picker opens (`enabled`).
export function useFixedExpenseCandidates(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [...queries.fixedExpenses.timeline(id).queryKey, "candidates"],
    queryFn: () => fetchFixedExpenseCandidates(id),
    enabled,
  })
}

// Manually attach an existing invoice to a fixed expense from a "Missing" row,
// then refresh that expense's timeline.
export function useLinkInvoiceToFixedExpense(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invoiceId: string) => linkInvoiceToFixedExpense({ id, invoiceId }),
    onSuccess: () => {
      toast.success("Invoice linked")
      queryClient.invalidateQueries({ queryKey: queries.fixedExpenses.timeline(id).queryKey })
    },
    onError: (error) => toast.error(error.message),
  })
}
