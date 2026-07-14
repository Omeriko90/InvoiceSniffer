import { fetchCandidates } from "@/api/reconcile"
import { createQueryKeys } from "@lukemorales/query-key-factory"

type Charge = { merchant: string; amount: string; date: string; currency: string }
type Range = { from: string; to: string }

export const reconcileKeys = createQueryKeys("reconcile", {
  candidates: (charge: Charge, range: Range, q: string) => ({
    queryKey: [charge.merchant, charge.amount, charge.date, range.from, range.to, q],
    queryFn: () => fetchCandidates(charge, range, q),
  }),
})
