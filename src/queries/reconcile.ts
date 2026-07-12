import { fetchCandidates } from "@/api/reconcile"
import { createQueryKeys } from "@lukemorales/query-key-factory"

export const reconcileKeys = createQueryKeys("reconcile", {
  candidates: (transactionId: string, q: string) => ({
    queryKey: [transactionId, q],
    queryFn: () => fetchCandidates(transactionId, q),
  }),
})
