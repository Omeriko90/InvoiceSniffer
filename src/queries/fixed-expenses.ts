import { createQueryKeys } from "@lukemorales/query-key-factory"

// Timeline is paged via useInfiniteQuery (see useFixedExpenseTimeline), so only
// the key is defined here; the queryFn lives in the hook to thread pageParam.
export const fixedExpensesKeys = createQueryKeys("fixedExpenses", {
  timeline: (id: string) => ({ queryKey: [id] }),
})
