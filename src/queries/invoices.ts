import { createQueryKeys } from "@lukemorales/query-key-factory"

// Single-invoice detail (drawer opened outside the list, e.g. a fixed-expense
// period). The list itself is server-fetched, so only the detail key lives here.
export const invoicesKeys = createQueryKeys("invoices", {
  detail: (id: string) => ({ queryKey: [id] }),
})
